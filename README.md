# node-shopping

Prerequisites
•	MongoDB.
•	API testing application.
•	Install all the JS dependencies using ‘npm install’ command.

This API is deployed in heroku is this url to test: Heroku URL: https://stormy-brushlands-63398.herokuapp.com/

API routes.
This API contains 8 routes.

-Route POST /register:      Clients should provide an email address, name and password while requesting to the route. This will create 
                            a new user in the Users collection in the database. The client should provide the data in 
                            following format - {“email”: “email@site.com”, “name”: “Any name”, “password”: “123456”}.
                            This will return a token in the response header. That token can be used to access the private routes.
-Route POST /login:         This route requires an email address and the password from the client. This will create a new token and 
                            return in the response header. The client should provide the data in 
                            following format - {“email”: “email@site.com”, “password”: “123456”}.
-Route GET /products:       This route returns the details of all the products available in the database. 
-Route DELETE /logout:      This is a private route. Users need to provide token in their request header while requesting this route. 
                            This will delete the token from the customer document in database. If customers need to access any private 
                            route again, they need to request Route /login and get the token.
-Route PATCH /customer:     This is a private route which updates, customer name and email address. The client needs to provide the email 
                            address and name when they are making the request. The client should provide the data in 
                            following format - {“email”: “email@site.com”, “name”: “Any name”}.
-Route POST /cart/add:      This is a private route. This route requires token in the request header, product ID and quantity. Using this 
                            route client can add an item to the cart. The client should provide the data in 
                            following format - {“productID”: “123098762”, “quantity”: 10}.
-Route GET /cart:           This is a private route which requires token. This route will return all the items in the cart of the 
                            logged in client.
-Route DELETE /cart/remove: This is a private route which requires token. The client should provide product id with the request. 
                            This route will remove the product from the requested client.
                            
                            
----------------Testing-----------------
Automated unit test case added. Server/tests/server.test.js file contains the automated test script. Use ‘npm test’ command to run 
the test. Test cases are covered for all the routes. 
Total test cases: 16.
If you are testing this in mac or Linux please change the test script. 
"scripts": {
    "test": "SET \"NODE_ENV=test\" && mocha server/**/*.test.js",
    "start": "node server/server.js"

Add this in the “test”: 
“export NODE_ENV=test && mocha server/**/*.test.js”

