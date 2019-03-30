const mongoose = require("mongoose");

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
  {
    name: "product 1",
    price: 150.5,
    quantity: 50
  },
  {
    name: "product 2",
    price: 1000,
    quantity: 90
  },
  {
    name: "product 3",
    price: 2000,
    quantity: 10
  }
];

Product.deleteMany({})
  .then(() => {
    Product.insertMany(products);
  })
  .catch(err => console.log(err));

module.exports = { Product };
