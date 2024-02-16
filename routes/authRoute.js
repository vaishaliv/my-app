require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Users = require("../models/userModel");

router.get("/", (req, res) => {
  res.send("Hello from auth....");
});

router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;
  const isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : false;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { name, email, hashedPassword };
    const token = jwt.sign(
      { name, email, isAdmin },
      process.env.ACCESS_TOKEN_KEY,
      {
        expiresIn: "15s",
      }
    );

    const user = new Users({
      name,
      username,
      email,
      password: hashedPassword,
      resetToken: token,
      isAdmin,
    });
    const savedUser = await user.save();
    return res.status(201).json(savedUser);
  } catch (ex) {
    return res.json(ex.message);
  }
});

// A route to verify and use the reset token
router.post("/reset/:token", (req, res) => {
  // Get the reset token from the cookie
  const resetToken = req.cookies.resetToken;
  // Get the new password from the body
  const { newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res
      .status(400)
      .json({ message: "Missing reset token or new password" });
  }
  // Verify the reset token using jwt
  jwt.verify(resetToken, process.env.RESET_ACCESS_TOKEN_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Invalid or expired reset token" });
    }
    // Get the email from the decoded payload
    const { email } = decoded;
    // Update the user's password in the database
    // This is just a mock function, you should use your own logic here
    updateUserPassword(email, newPassword);
    // Clear the reset token cookie
    res.clearCookie("resetToken");
    // Send a success message to the user
    res.json({ message: "Your password has been reset successfully" });
  });
});

// A mock function to update the user's password in the database
// You should replace this with your own logic
function updateUserPassword(email, newPassword) {
  console.log(`Updating password for ${email} to ${newPassword}`);
}

// create a route to generate and send a reset token
router.post("/forgot-password", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, //This is app-password, not the actual gmail password
      },
    });
    // get the user's email from the request body
    const email = req.body.email;

    // find the user by email in the database
    const user = await Users.findOne({ email });

    // if no user, return 404 (not found)
    if (!user) return res.sendStatus(404);

    // generate a reset token with a 10-minute expiration
    const resetToken = jwt.sign({ email }, process.env.RESET_ACCESS_TOKEN_KEY, {
      expiresIn: "10m",
    });

    // create an email message with the reset token
    const message = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO_USER,
      subject: "Password Reset",
      text: `You have requested to reset your password. Please use the following code to verify your identity.`,
      html: `<b>Hello ${user[0].name}. <a href="http://localhost:3000/verify/${resetToken}">click here</a> to verify your email</b>`,
      // html body with the token as a link
    };

    // send the email message
    const response = await transporter.sendMail(message);
    console.log(response);
  } catch (ex) {
    console.log(ex);
    res.json(ex.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await Users.find({ email });

    console.log("User lookup using email, user found?...", user);

    if (!user || user.length === 0) {
      return res.status(404).send("User Not found!");
    } else {
      bcrypt.compare(password, user[0].password, function (err, result) {
        if (err) {
          console.log("--- err...", err.message);
          return res.json(err.message);
        }
        if (result) {
          const u = user[0];
          const userObj = {
            name: u.name,
            email: u.email,
            isAdmin: u.isAdmin,
          };
          const accessToken = jwt.sign(userObj, process.env.ACCESS_TOKEN_KEY, {
            expiresIn: "15m",
          });
          const resetToken = jwt.sign(
            userObj,
            process.env.RESET_ACCESS_TOKEN_KEY
          );
          // Send the reset token as an HTTP-only cookie
          res.cookie("resetToken", resetToken, { httpOnly: true });
          // Send a success message to the user
          // res.json({ message: "A reset token has been sent to your email" });
          console.log("SENT JWT and http-only cookie");
          return res.json(accessToken);
        } else {
          // response is OutgoingMessage object that server response http request
          return res.json({
            success: false,
            message: "passwords do not match",
          });
        }
      });
    }
  } catch (ex) {
    return res.status(500).json(ex.message);
  }
});

/**
 * 200  OK
 * 404  NOT FOUND
 * 500  INTERNAL SERVER ERROR
 * 401  UNAUTHORIZED
 * 403  FORBIDDEN
 *
 */

// To check if user for given Email exists
async function findUserByEmail(req, res, next) {
  let user;
  try {
    let email = req.body.email;
    user = await Users.find({ email });
    if (user && user.length !== 0) {
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
function generateAccessToken(req, res, next) {
  const { name, email, isAdmin } = req.body;
  const user = { name, email, isAdmin };
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, {
    expiresIn: "15m",
  });
  req.accessToken = accessToken;
  next();
}
function generateResetToken(req, res, next) {
  const { name, email, isAdmin } = req.body;
  const user = { name, email, isAdmin };
  const resetToken = jwt.sign(user, process.env.RESET_ACCESS_TOKEN_KEY);
  req.resetToken = resetToken;
  next();
}
function decodeAccessToken(req, res, next) {
  // get the token from the header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // if no token, return 401 (unauthorized)
  if (!token) return res.sendStatus(401);

  // verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
    // if invalid, return 403 (forbidden)
    if (err) return res.sendStatus(403);

    // assign the user to the request object
    req.user = user;

    // call the next middleware function
    next();
  });
}
function decodeResetToken(req, res, next) {
  const { token } = req.body;
  const decodedToken = jwt.verify(
    token,
    process.env.RESET_ACCESS_TOKEN_SECRETE
  );
  req.decodedToken = decodedToken;
  next();
}

function authenticate(req, res, next) {
  console.log("AUTHENTICATING", cachedUsers, users);
  next();
}

module.exports = router;
