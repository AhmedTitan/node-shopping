var env = process.env.NODE_ENV || "development"; //assigning environment
const mongoose = require("mongoose");

if (env == "development") {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = "mongodb://localhost:27017/ShoppingAPI";
} else if (env === "test") {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = "mongodb://localhost:27017/ShoppingAPItest";
}

mongoose.connect(process.env.MONGODB_URI); //connecting database

module.exports = { mongoose };
