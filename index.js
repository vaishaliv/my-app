require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/authRoute");
const userRouter = require("./routes/userRoute");
const productRouter = require("./routes/productRoute");

const corsOptions = {
  //   origin: "http://localhost:3000",
  origin: "*",
  optionSuccessStatus: 200,
};

app.use(cookieParser());

//Middleware
app.use(express.json());
app.use(cors(corsOptions));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);

mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.DATABASE_URL, { useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB: %s \n ", process.env.DATABASE_URL);
  })
  .catch((err) => {
    console.error("MongoDB connection error: %s \n", err);
  });

console.log("env....", process.env.NODE_ENV);
console.log("env1....", process.env.DATABASE_URL);

const port = 5000 || process.env.PORT;
app.listen(port, () => console.log(`Listening on port ${port}`));
