const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { ObjectID } = require("mongodb");
const _ = require("lodash");

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

CustomerSchema.methods.toJSON = function() {
  var customer = this;
  var customerObject = customer.toObject();

  return _.pick(customerObject, ["_id", "email", "name"]);
};

CustomerSchema.methods.genAuthToken = function() {
  //Generates a token
  let customer = this;
  let access = "auth";
  let token = jwt
    .sign({ id: customer._id.toHexString(), access }, "shoppingApi")
    .toString();

  customer.tokens = customer.tokens.concat([{ access, token }]);
  return customer.save().then(() => token);
};

CustomerSchema.methods.removeToken = function(token) {
  //recieves token as parameter. Deletes the token from the database
  const customer = this;

  return customer.update({
    $pull: {
      tokens: { token }
    }
  });
};

CustomerSchema.methods.addToCart = async function(item) {
  //recieves product id and quantity as item object
  //Add the item to the cart. if item is already added in the the cart, only increases the quantity
  const customer = this;
  try {
    const product = await Product.findById(new ObjectID(item.productID));

    //check if the productid is valid and there is enaugh quantity
    if (product === null || product.quantity < item.quantity) {
      return Promise.reject("Invalid product detail");
    }

    let cartArr = [...customer.cart];
    let updatedItem = cartArr.filter(p => p.productID == item.productID); //filter the item
    if (updatedItem.length > 0) {
      //if item is already in the cart only increase the quantity
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
      //if item is not available in the cart add the item to the cart
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
  //recieves productID as parameter and remove the item from the cart
  const customer = this;

  return customer.update({
    $pull: {
      cart: { productID: new ObjectID(id) }
    }
  });
};

CustomerSchema.statics.verifyCustomer = function(email, password) {
  //Checks if the recieved email and password are valid
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
  //find the customer using recieved token
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
  //check the password before save the customer
  //if password is modified hash the new password and save
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
