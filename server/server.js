const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

require("./config/config");
const { Product } = require("./models/product");
const { Customer } = require("./models/customer");
const { authenticate } = require("./middleware/authenticate");
const port = process.env.PORT;

let app = express();
app.use(bodyParser.json());

//-----Routes-----
app.post("/register", async (req, res) => {
  if (!req.body.email || !req.body.name || !req.body.password) {
    return res.status(400).send({ message: "Missing data." });
  }
  const newCustomer = new Customer({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name
  });

  try {
    await newCustomer.save();
    let token = await newCustomer.genAuthToken();
    res.header("x-auth", token).send(newCustomer);
  } catch (err) {
    res
      .status(400)
      .send({ message: "Unable to register the customer", Error: err.errmsg });
  }
});

app.post("/login", async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({ message: "Missing data." });
  }
  try {
    let customer = await Customer.verifyCustomer(
      req.body.email,
      req.body.password
    );
    let token = await customer.genAuthToken();
    res.header("x-auth", token).send(customer);
  } catch (err) {
    res.status(400).send({ message: "invalid details", Error: err.errmsg });
  }
});

app.delete("/logout", authenticate, async (req, res) => {
  try {
    let result = await req.customer.removeToken(req.token);
    res.send({ message: "logged out", result });
  } catch (err) {
    res.status(400).send({ error: "user already logged out", err });
  }
});

app.patch("/customer", authenticate, (req, res) => {
  let data = _.pick(req.body, ["email", "name"]);
  if (!data.email && !data.name) {
    return res.status(400).send({ message: "Missing data" });
  }
  Customer.findOneAndUpdate(
    { _id: req.customer._id },
    { $set: data },
    { new: true }
  ).then(result => {
    if (!result) {
      res
        .status(400)
        .send({ message: "Unable to find the customer details in DB" });
    }
    res.send({ message: "Details updated successsfully", data: result });
  });
});

app.get("/products", (req, res) => {
  Product.find({}).then(products => {
    res.send(products);
  });
});

app.post("/cart/add", authenticate, (req, res) => {
  const data = _.pick(req.body, ["productID", "quantity"]);
  req.customer
    .addToCart(data)
    .then(result => {
      let cart = JSON.stringify(req.customer.cart);
      res.send(JSON.parse(cart));
    })
    .catch(err => res.status(400).send(err));
});

app.get("/cart", authenticate, async (req, res) => {
  try {
    let cart = JSON.stringify(req.customer.cart);
    res.send({ cart: JSON.parse(cart) });
  } catch (e) {
    res.status(400).send({ messaget: "Please login to access your the cart" });
  }
});

app.delete("/cart/remove", authenticate, async (req, res) => {
  const id = req.body.id;
  try {
    const item = await req.customer.removeCartItem(id);
    if (item.nModified === 0) {
      return res.status(4000).send({ message: "Invalid productID" });
    }
    res.send({ message: "Item removed", item });
  } catch (e) {
    res.status(400).send({ message: "Invalid productID" });
  }
});

app.get("/", (req, res) => {
  res.send({
    message: "Shopping API"
  });
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});

module.exports = { app };
