const { Customer } = require("../models/customer");

let authenticate = (req, res, next) => {
  //this method varifies the token
  var token = req.header("x-auth");
  Customer.findByToken(token) //get customer details using recieved token
    .then(res => {
      if (!res) {
        return Promise.reject("Invalid token");
      }
      req.customer = res;
      req.token = token;
      next();
    })
    .catch(err => {
      res.status(400).send({ error: err });
    });
};

module.exports = { authenticate };
