const mongoose = require("mongoose");
const { ObjectID } = require("mongodb");

var Product = mongoose.model("Product", {
  name: {
    type: "String",
    required: true,
    minlength: 1,
    trim: true
  },
  price: {
    type: "number",
    required: true
  },
  quantity: {
    type: "number",
    default: 0
  }
});

const products = [
  //creating products
  {
    _id: new ObjectID("5ca0bf66d885c726507ca88d"),
    name: "product 1",
    price: 150.5,
    quantity: 50
  },
  {
    _id: new ObjectID("5ca0bf66d885c726507ca88e"),
    name: "product 2",
    price: 1000,
    quantity: 90
  },
  {
    _id: new ObjectID("5ca0bf66d885c726507ca88f"),
    name: "product 3",
    price: 2000,
    quantity: 10
  }
];

Product.deleteMany({})
  //deleting all the data in product collection
  .then(() => {
    //adding new data
    Product.insertMany(products);
  })
  .catch(err => console.log(err));

module.exports = { Product };
