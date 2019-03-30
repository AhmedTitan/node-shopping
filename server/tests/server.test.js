const expect = require("expect");
const request = require("supertest");
const { ObjectID } = require("mongodb");

const { Customer } = require("../models/customer");
const { app } = require("../server");

before(function(done) {
  Customer.deleteMany({}).then();
  done();
});

describe("POST /register", () => {
  it("Should recieve a message", done => {
    request(app)
      .get("/")
      .expect(200)
      .expect(doc => {
        expect(doc.body.message).toBeTruthy();
      })
      .end(done);
  });

  it("Should create a new customer", function(done) {
    this.timeout(50000);
    const newCustomer = {
      _id: new ObjectID(),
      email: "newcustomer@213.com",
      password: 123456,
      name: "Customer new"
    };
    request(app)
      .post("/register")
      .send(newCustomer)
      .expect(200)
      .expect(doc => {
        expect(doc.body.customer._id).toBeTruthy();
      })
      .end(done);
  });

  it("should not create a new customer if the email is invalid", done => {
    const newCustomer = {
      _id: new ObjectID(),
      email: "newcustomer@213",
      password: 123456,
      name: "Customer new"
    };
    request(app)
      .post("/register")
      .send(newCustomer)
      .expect(400)
      .expect(doc => {
        expect(doc.body.message).toBe("Unable to register the customer");
      })
      .end(done);
  });
});

describe("POST /register", () => {
  it("should get all products", done => {
    request(app)
      .get("/products")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect(res => {
        expect(res.body.length).toBe(3);
      })
      .end(done);
  });
});
