const mongoose = require("mongoose");

const imageArr = new mongoose.Schema({
  img: {
    type: String,
  },
});
const productSchema = new mongoose.Schema({
  title: {
    required: true,
    type: String,
  },
  description: {
    type: String,
    default: "No description",
  },
  price: {
    type: Number,
    default: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0.0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    default: 0,
  },
  brand: {
    required: true,
    type: String,
    default: "",
  },
  category: {
    required: true,
    type: String,
  },
  images: {
    type: [String],
    default: "",
  },
});

module.exports = mongoose.model("Product", productSchema);
