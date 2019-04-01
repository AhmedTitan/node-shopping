//External libraries
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

//Custom files
require("./config/config"); //Database and environment variable
const { Product } = require("./models/product");
const { Customer } = require("./models/customer");
const { authenticate } = require("./middleware/authenticate");
const port = process.env.PORT;

let app = express();
app.use(bodyParser.json());

//-----Routes-----
app.post("/register", async (req, res) => {
  //This route requires: Email, Name and Password from the client

  if (!req.body.email || !req.body.name || !req.body.password) {
    //Responding with 400 status code if required data are missing
    return res.status(400).send({ message: "Missing data." });
  }
  const newCustomer = new Customer({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name
  });

  try {
    await newCustomer.save(); //creating a new customer in the database
    let token = await newCustomer.genAuthToken(); //Generating a new token for the created customer
    res.header("x-auth", token).send(newCustomer);
  } catch (err) {
    res
      .status(400) //If there is any problem with creating customer responding 400 status code
      .send({ message: "Unable to register the customer", Error: err.errmsg });
  }
});

app.post("/login", async (req, res) => {
  //This route requires: Email and Password from the client
  if (!req.body.email || !req.body.password) {
    //If Email or password missing returning 400 status code with a message
    return res.status(400).send({ message: "Missing data." });
  }
  try {
    //verifying the customer details
    let customer = await Customer.verifyCustomer(
      req.body.email,
      req.body.password
    );
    let token = await customer.genAuthToken(); //Generating a new token for the customer
    res.header("x-auth", token).send(customer);
  } catch (err) {
    //If Email or password is invalid responding with 400 status code
    res.status(400).send({ message: "invalid details", Error: err.errmsg });
  }
});

app.delete("/logout", authenticate, async (req, res) => {
  //This route deletes the token from the customer DB
  //require token as a x-auth header from the client
  try {
    let result = await req.customer.removeToken(req.token); //deleting customer token
    res.send({ message: "Successfully logged out" });
  } catch (err) {
    //If there is an error or invalid token, responding a message with 400 status code
    res.status(400).send({ error: "user already logged out" });
  }
});

app.patch("/customer", authenticate, (req, res) => {
  //This route updates customer Email address and Name
  //Require email address and password from the client
  let data = _.pick(req.body, ["email", "name"]);
  if (!data.email && !data.name) {
    //Responding 400 status code if Email and password are not recieved
    return res.status(400).send({ message: "Missing data" });
  }
  Customer.findOneAndUpdate(
    //Updating customer details
    { _id: req.customer._id },
    { $set: data },
    { new: true }
  ).then(result => {
    if (!result) {
      res
        .status(400) //If any error responding a message
        .send({ message: "Unable to find the customer details in DB" });
    }
    //Successful response
    res.send({ message: "Details updated successsfully", data: result });
  });
});

app.get("/products", (req, res) => {
  //Returns all the product details form the DB
  Product.find({}).then(products => {
    res.send(products);
  });
});

app.post("/cart/add", authenticate, (req, res) => {
  //this route adding an item to customer's cart
  //require product id and quantity from the customer
  const data = _.pick(req.body, ["productID", "quantity"]);
  req.customer
    .addToCart(data)
    .then(result => {
      let cart = JSON.stringify(req.customer.cart);
      res.send(JSON.parse(cart)); //responding cart details if product is added to the cart
    })
    .catch(err => res.status(400).send(err)); //responding status code 400 if there is any error
});

app.get("/cart", authenticate, async (req, res) => {
  //this route returns all the data from the cart for requesting customer
  try {
    let cart = JSON.stringify(req.customer.cart);
    res.send({ cart: JSON.parse(cart) });
  } catch (e) {
    //if customer is not logged in sending status code 400 with a message
    res.status(400).send({ messaget: "Please login to access your the cart" });
  }
});

app.delete("/cart/remove", authenticate, async (req, res) => {
  //this route removes item from the cart
  const id = req.body.id; //require product ID from the client
  try {
    const item = await req.customer.removeCartItem(id);
    if (item.nModified === 0) {
      //if product id is invalid espond status code 400
      return res.status(400).send({ message: "Invalid productID" });
    }
    //if item is removed respond with a message
    res.send({ message: "Item removed" });
  } catch (e) {
    //if product id is invalid respond status code 400
    res.status(400).send({ message: "Invalid productID" });
  }
});

app.get("/", (req, res) => {
  //this will respond a welcome message
  res.send({
    message: "Welcome to Shopping API"
  });
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});

module.exports = { app };
