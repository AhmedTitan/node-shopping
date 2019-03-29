const express = require("express");
const bodyParser = require("body-parser");

const port = process.env.PORT || 3000;

var app = express();
app.use(bodyParser.json());

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.name || !req.body.password) {
    return res.status(400).send({ message: "Missing data." });
  }
  res.send({
    email: req.body.email,
    name: req.body.name,
    password: req.body.password
  });
});
app.get("/", (req, res) => {
  res.send({
    message: "Shopping API"
  });
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});
