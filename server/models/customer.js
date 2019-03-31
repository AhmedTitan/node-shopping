const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { ObjectID } = require("mongodb");

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
  },
  tokens: [
    {
      access: {
        type: "string",
        required: true
      },
      token: {
        type: "string",
        require: true
      }
    }
  ],
  cart: [
    {
      productID: {
        type: ObjectID,
        require: true
      },
      quantity: {
        type: "number",
        default: 0
      }
    }
  ]
});

CustomerSchema.methods.genAuthToken = function() {
  let customer = this;
  let access = "auth";
  let token = jwt
    .sign({ id: customer._id.toHexString(), access }, "shoppingApi")
    .toString();

  customer.tokens = customer.tokens.concat([{ access, token }]);
  return customer.save().then(() => token);
};

CustomerSchema.methods.removeToken = function(token) {
  let customer = this;

  return customer.update({
    $pull: {
      tokens: { token }
    }
  });
};

CustomerSchema.statics.verifyCustomer = function(email, password) {
  let Customer = this;
  return Customer.findOne({ email: email }).then(res => {
    if (!res) {
      return Promise.reject("invalid email address");
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, res.password, (err, success) => {
        if (success) {
          return resolve(res);
        } else {
          return reject("Invalid password");
        }
      });
    });
  });
};

CustomerSchema.statics.findByToken = function(token) {
  let Customer = this;
  let decode;
  try {
    decode = jwt.verify(token, "shoppingApi");
  } catch (e) {
    return Promise.reject("Invalid token");
  }
  return Customer.findOne({
    "_id:": decode._id,
    "tokens.token": token,
    "tokens.access": "auth"
  });
};

CustomerSchema.pre("save", function(next) {
  var customer = this;
  if (customer.isModified("password")) {
    var newPassword = customer.password;
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newPassword, salt, (err, hash) => {
        customer.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

let Customer = mongoose.model("Customer", CustomerSchema);

module.exports = { Customer };
