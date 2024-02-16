const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Users = require("../models/userModel");
const mongoose = require("mongoose");

const USERS = require("../data/users.json");

const schema = Joi.object({
  name: Joi.string().min(5).max(10).required(),
  username: Joi.string().min(5).max(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(255).required(),
  resetToken: Joi.string().min(10).max(1052).required(),
});

// User GET Routes...
router.get("/sortByName", async (req, res) => {
  try {
    const users = await Users.find().sort({ name: 1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const sortQuery = req.query.sort;
    const filterQuery = req.query;
    let users;
    if (filterQuery) {
      users = await Users.find(filterQuery);
    } else if (sortQuery) {
      users = await Users.find({}).sort({ [sortQuery]: 1 });
    } else {
      users = await Users.find();
    }
    return res.send(users);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});
router.get("/:id", findUser, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await Users.findById(userId);
    return res.send(user);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// User POST Routes...
router.post("/", findUserByEmail, validate, async (req, res) => {
  const user = new Users({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
    password: req.body.password || "",
    resetToken: req.body.resetToken || "",    
  });
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
router.post("/bulkadd", async (req, res) => {
  try {
    const users = await Users.insertMany(USERS);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User DELETE Routes...
router.delete("/bulkdelete", async (req, res) => {
  let str = "";
  try {
    const result = await Users.deleteMany();
    if (result && result.acknowledged) {
      str =
        result.deletedCount === 0
          ? `No records found to delete!`
          : `Total ${result.deletedCount} records deleted!`;
      res.status(200).json(str);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.delete("/:id", findUser, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await Users.findByIdAndDelete(userId);
    return res.send(user);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// User PATCH Routes...
router.patch(
  "/:id",
  findUserByEmail,
  findUser,
  validateFields,
  async (req, res) => {
    try {
      const query = new Users({
        _id: res.user._id,
        name: req.body.name || res.user.name,
        username: req.body.username || res.user.username,
        email: req.body.email || res.user.email,
        password: req.body.password || res.user.password,
        resetToken: req.body.resetToken || res.user.resetToken,
        isAdmin:
          req.body.isAdmin !== undefined ? req.body.isAdmin : res.user.isAdmin,
      });

      const updatedUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        query,
        { new: true }
      );
      res.json(updatedUser);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

//// Supporting Functions...
// Validate individual field for patch requests
function validateFields(req, res, next) {
  const nameSchema = Joi.string().min(5).max(10).required().label("Name");
  const usernameSchema = Joi.string()
    .min(5)
    .max(10)
    .required()
    .label("Username");
  const emailSchema = Joi.string().email().required().label("Email");
  const passwordSchema = Joi.string()
    .min(8)
    .max(255)
    .required()
    .label("Password");

  let result;
  if (req.body.name && nameSchema.validate(req.body.name).error) {
    result = {
      ...result,
      name: nameSchema.validate(req.body.name).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (req.body.username && usernameSchema.validate(req.body.username).error) {
    result = {
      ...result,
      userName: usernameSchema.validate(req.body.username).error?.details[0]
        .message,
    };
    return res.status(400).send(result);
  }
  if (req.body.email && emailSchema.validate(req.body.email).error) {
    result = {
      ...result,
      email: emailSchema.validate(req.body.email).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (req.body.password && passwordSchema.validate(req.body.password).error) {
    result = {
      ...result,
      password: passwordSchema.validate(req.body.password).error?.details[0]
        .message,
    };
    return res.status(400).send(result);
  }

  next();
}
// Validate all fields for post requests
function validate(req, res, next) {
  const result = schema.validate(req.body);
  if (result.error) {
    req.result = result;
    res.result = result;
  }
  if (req.result) {
    const error = req.result.error.details[0].message;
    return res.status(400).send(error);
  }
  next();
}
// To find user for given _id
async function findUser(req, res, next) {
  let user;
  try {
    let id = req.params.id;
    user = await Users.findById(id);
    if (!user || user === null)
      return res.status(404).send(`User with the id ${id} was not found`);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  req.user = user;
  res.user = user;
  next();
}
// To check if user for given Email exists
async function findUserByEmail(req, res, next) {
  let user;
  try {
    let email = req.body.email;
    user = await Users.find({ email });
    if (user && user.length !==0) {
      return res
        .status(404)
        .send(`User with the email ${email} already exists!`);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  req.user = user;
  res.user = user;
  next();
}

module.exports = router;
