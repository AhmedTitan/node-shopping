const { Customer } = require("../models/customer");

let authenticate = (req, res, next) => {
  var token = req.header("x-auth");
  Customer.findByToken(token)
    .then(res => {
      if (!res) {
        Promise.reject("Invalid token");
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
