# my-app
Commands used to setup node project

npm init --y
npm i -D nodemon
npm i express mongoose joi cors config dotenv
npm i crypto bcrypt jsonwebtoken uuid

Add this in package.json
"scripts": {
    "start": "nodemon index.js"
}

Fake Api Data used from
https://jsonplaceholder.typicode.com/users
https://dummyjson.com/products

To generate ACCESS KEYS
require('crypto').randomBytes(64).toString('hex');









