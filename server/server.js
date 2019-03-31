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
    let token = newCustomer.genAuthToken();
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
    await req.customer.removeToken(req.token);
    res.send({ message: "logged out" });
  } catch (err) {
    res.status(400).send({ error: "user already logged out", err });
  }
});

app.patch("/customer", authenticate, (req, res) => {
  let data = _.pick(req.body, ["email", "name"]);
  if (!data.email && !data.name) {
    return res.status(400).send({ message: "No data recieved" });
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

// app.post("/cart/add", authenticate, (req, res) => {
//   const data = _.pick(req.body, ["productID", "quantity"]);
//   console.log(data);
// });

app.get("/", (req, res) => {
  res.send({
    message: "Shopping API"
  });
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});

module.exports = { app };
