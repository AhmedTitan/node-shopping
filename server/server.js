const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

let env = process.env.NODE_ENV || "development";
if (env === "test") {
  mongoose.connect("mongodb://localhost:27017/ShoppingAPItest");
} else {
  mongoose.connect("mongodb://localhost:27017/ShoppingAPI");
}

const { Product } = require("./models/product");
const { Customer } = require("./models/customer");
const port = process.env.PORT || 3000;

let app = express();
app.use(bodyParser.json());

//Routes
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.name || !req.body.password) {
    return res.status(400).send({ message: "Missing data." });
  }

  const newCustomer = new Customer({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name
  });

  newCustomer
    .save()
    .then(customer => res.send({ message: "Data saved", customer }))
    .catch(err =>
      res
        .status(400)
        .send({ message: "Unable to register the customer", Error: err.errmsg })
    );
});

app.get("/", (req, res) => {
  res.send({
    message: "Shopping API"
  });
});

app.get("/products", (req, res) => {
  Product.find({}).then(products => {
    res.send(products);
  });
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});

module.exports = { app };
