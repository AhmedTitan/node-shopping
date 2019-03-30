const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const CustomerSchema = new mongoose.Schema({
  email: {
    type: "string",
    required: true,
    trim: true,
    minlength: 6,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: `{VALUE} is not a valid email`
    }
  },
  password: {
    type: "string",
    required: true,
    minlength: 6
  },
  name: {
    type: "string",
    required: true,
    trim: true
  }
});

CustomerSchema.pre("save", function(next) {
  var user = this;
  if (user.isModified("password")) {
    var newPassword = user.password;
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newPassword, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

let Customer = mongoose.model("Customer", CustomerSchema);

module.exports = { Customer };
