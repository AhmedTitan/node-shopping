const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { ObjectID } = require("mongodb");

const { Product } = require("./product");

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
  const customer = this;

  return customer.update({
    $pull: {
      tokens: { token }
    }
  });
};

CustomerSchema.methods.addToCart = async function(item) {
  const customer = this;
  try {
    const product = await Product.findById(new ObjectID(item.productID));

    if (product === null || product.quantity < item.quantity) {
      return Promise.reject("Invalid product detail");
    }

    let cartArr = [...customer.cart];
    let updatedItem = cartArr.filter(p => p.productID == item.productID);
    if (updatedItem.length > 0) {
      updatedItem[0].quantity += item.quantity;
      if (product.quantity < updatedItem[0].quantity) {
        return Promise.reject("Please check the quantity");
      }

      let cartArrfiltered = cartArr.filter(p => p.productID != item.productID);
      cartArrfiltered.push(updatedItem[0]);
      customer.cart = [];
      customer.cart = [...cartArrfiltered];
      return customer.save();
    } else {
      customer.cart = customer.cart.concat([
        { productID: item.productID, quantity: item.quantity }
      ]);
      return customer.save();
    }
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

CustomerSchema.methods.removeCartItem = function(id) {
  const customer = this;

  return customer.update({
    $pull: {
      cart: { productID: new ObjectID(id) }
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
