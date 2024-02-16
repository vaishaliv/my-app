Commands used to setup node project

npm init --y
npm i -D nodemon
npm i express mongoose joi cors config dotenv
npm i crypto bcrypt jsonwebtoken uuid

Add this in package.json
"scripts": {
    "start": "nodemon index.js"
}

Connection to MongoDB Atlas
https://cloud.mongodb.com/v2/6500d242fbbe81292b4d5986#/clusters
Username : vaishali.viragi@gmail.com
Password : IshaSonu1

Fake Api Data used from
https://jsonplaceholder.typicode.com/users
https://dummyjson.com/products

To generate ACCESS KEYS
require('crypto').randomBytes(64).toString('hex');
'4403e72e4c8a88e3bf8e685af78b43e07a368227948755d6706f0f19b0b4cbfc9ed3107bde2dba39312c5a300420088f7dd7d42274eb0694fcb8891736f3028f'
>
> require('crypto').randomBytes(64).toString('hex');
'e9e02ef26407340fc949e37ec686a9c688911e53d531a23fb10482aa6e8dee7ceeb1388554fd8568a0c737de6a9f52eb9636206f87cca905c26439f1643707a2'

C:\Users\vaish\React\INT1\server




