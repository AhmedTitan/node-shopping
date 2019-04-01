const expect = require("expect");
const request = require("supertest");
const { ObjectID } = require("mongodb");

const { Customer } = require("../models/customer");
const { app } = require("../server");

let deleteData = () => {
  Customer.deleteMany({}).then();
};

const newCustomer = {
  email: "newcustomer@213.com",
  password: 123456,
  name: "Customer new"
};

describe("/", () => {
  it("Should recieve a message", done => {
    request(app)
      .get("/")
      .expect(200)
      .expect(doc => {
        expect(doc.body.message).toBeTruthy();
      })
      .end(done);
  });
});

describe("POST /register", () => {
  deleteData();
  it("should create a new customer", function(done) {
    this.timeout(50000);

    request(app)
      .post("/register")
      .send(newCustomer)
      .expect(200)
      .expect(doc => {
        expect(doc.body._id).toBeTruthy();
        expect(doc.header["x-auth"]).toBeTruthy();
        newCustomer.header = doc.header["x-auth"];
      })
      .end(done);
  });

  it("should not create a new customer if the email is invalid", done => {
    const customer2 = {
      _id: new ObjectID(),
      email: "wrong@213",
      password: 123456,
      name: "Customer AMD"
    };
    request(app)
      .post("/register")
      .send(customer2)
      .expect(400)
      .expect(doc => {
        expect(doc.body.message).toBe("Unable to register the customer");
      })
      .end(done);
  });
});

describe("GET /products", () => {
  it("should get all products", done => {
    request(app)
      .get("/products")
      .expect(200)
      .expect(res => {
        expect(res.body.length).toBe(3);
      })
      .end(done);
  });
});

describe("DELETE /logout", () => {
  it("should not logout if the header is invalid", done => {
    request(app)
      .delete("/logout")
      .set("x-auth", "234lkj56j575")
      .expect(400)
      .expect(res => {
        expect(res.body.error).toBe("Invalid token");
      })
      .end(err => {
        if (err) {
          return done(err);
        }
        Customer.findOne({ email: newCustomer.email })
          .then(res => {
            expect(res.tokens.length).toBe(1);
            done();
          })
          .catch(e => done(e));
      });
  });

  it("should delete the token from the customer document", done => {
    request(app)
      .delete("/logout")
      .set("x-auth", newCustomer.header)
      .expect(200)
      .expect(res => {
        expect(res.body.message).toBe("logged out");
      })
      .end(err => {
        if (err) {
          return done(err);
        }
        Customer.findOne({ email: newCustomer.email })
          .then(res => {
            expect(res.tokens.length).toBe(0);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe("POST /login", () => {
  it("should not login if the password or user name is wrong", done => {
    request(app)
      .post("/login")
      .send({
        email: newCustomer.email,
        password: newCustomer.password + "asd"
      })
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe("invalid details");
      })
      .end(done);
  });

  it("should return a token if successfully logged in", done => {
    request(app)
      .post("/login")
      .send({
        email: "newcustomer@213.com",
        password: "123456"
      })
      .expect(200)
      .expect(res => {
        expect(res.body).toMatchObject({
          email: "newcustomer@213.com",
          name: "Customer new"
        });
        expect(res.header["x-auth"]).toBeTruthy();
        newCustomer.header = res.header["x-auth"];
      })
      .end(done);
  });
});

describe("POST /cart/add", () => {
  it("should not add to cart if the product id is invalid", done => {
    request(app)
      .post("/cart/add")
      .send({ productID: "5ca0bf66d885c726507ca88a", quantity: 5 })
      .set("x-auth", newCustomer.header)
      .expect(400)
      .expect(res => {
        expect(res.text).toBe("Invalid product detail");
      })
      .end(done);
  });

  it("should not add to cart if the quantity is invalid", done => {
    request(app)
      .post("/cart/add")
      .send({ productID: "5ca0bf66d885c726507ca88d", quantity: 500 })
      .set("x-auth", newCustomer.header)
      .expect(400)
      .expect(res => {
        expect(res.text).toBe("Invalid product detail");
      })
      .end(done);
  });
  it("should not add to cart if the header is invalid", done => {
    request(app)
      .post("/cart/add")
      .send({ productID: "5ca0bf66d885c726507ca88d", quantity: 500 })
      .set("x-auth", "123lkj123hg")
      .expect(400)
      .expect(res => {
        expect(res.body.error).toBe("Invalid token");
      })
      .end(done);
  });

  it("should add productID to the cart if all the details are valid", done => {
    request(app)
      .post("/cart/add")
      .send({ productID: "5ca0bf66d885c726507ca88d", quantity: 10 })
      .set("x-auth", newCustomer.header)
      .expect(200)
      .expect(res => {
        expect(res.body.length).toBe(1);
      })
      .end(err => {
        if (err) {
          return done(err);
        }
        Customer.findOne({ email: newCustomer.email })
          .then(res => {
            expect(res.cart.length).toBe(1);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe("GET /cart", () => {
  it("should retrun all items in the cart", done => {
    request(app)
      .get("/cart")
      .set("x-auth", newCustomer.header)
      .expect(200)
      .expect(res => {
        expect(res.body.cart.length).toBe(1);
      })
      .end(done);
  });

  it("should not retrun items in the cart if header is invalid", done => {
    request(app)
      .get("/cart")
      .set("x-auth", "123lkjut2")
      .expect(400)
      .expect(res => {
        expect(res.body.error).toBe("Invalid token");
      })
      .end(done);
  });
});

describe("DELETE /cart/remove", () => {
  it("should not remove the item from the cart if id is invalid", done => {
    request(app)
      .delete("/cart/remove")
      .send({ id: "5ca0bf66d885c726507ca88a" })
      .set("x-auth", newCustomer.header)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe("Invalid productID");
      })
      .end(done);
  });

  it("should remove the item from the cart if id is valid", done => {
    request(app)
      .delete("/cart/remove")
      .send({ id: "5ca0bf66d885c726507ca88d" })
      .set("x-auth", newCustomer.header)
      .expect(200)
      .expect(res => {
        expect(res.body.message).toBe("Item removed");
      })
      .end(err => {
        if (err) {
          return done(err);
        }
        Customer.findOne({ email: newCustomer.email })
          .then(res => {
            expect(res.cart.length).toBe(0);
            done();
          })
          .catch(e => done(e));
      });
  });
});
