const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Products = require("../models/productModel");
const mongoose = require("mongoose");

const ProductObj = require("../data/products.json");
const PRODUCTS = ProductObj.products;

const schema = Joi.object({
  title: Joi.string().min(5).max(10).required(),
  description: Joi.string().min(10).max(100).required(),
  price: Joi.number().min(5).max(1000).required(),
  discountPercentage: Joi.number(),
  rating: Joi.number(),
  stock: Joi.number(),
  brand: Joi.string().min(5).max(30).required(),
  category: Joi.string().min(5).max(30).required(),
  images: Joi.array(),
});

// Product GET Routes...
router.get("/sortByTitle", async (req, res) => {
  try {
    const products = await Products.find().sort({ title: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const sortQuery = req.query.sort;
    const filterQuery = req.query;
    let products;
    if (filterQuery) {
      products = await Products.find(filterQuery);
    } else if (sortQuery) {
      products = await Products.find({}).sort({ [sortQuery]: 1 });
    } else {
      products = await Products.find();
      console.log("TEST:::::::::::::::", products)
    }
    return res.send(products);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});
router.get("/:id", findProduct, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findById(productId);
    return res.send(product);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Product POST Routes...
router.post("/", findProductByTitle, validate, async (req, res) => {
  const product = new Products({
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    discountPercentage: req.body.discountPercentage || 0,
    rating: req.body.rating || 0,
    stock: req.body.stock || 0,
    brand: req.body.brand || "",
    category: req.body.category || "",
    images: req.body.images || [],
  });
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
router.post("/bulkadd", async (req, res) => {
  try {
    const products = await Products.insertMany(PRODUCTS);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Product DELETE Routes...
router.delete("/bulkdelete", async (req, res) => {
  let str = "";
  try {
    const result = await Products.deleteMany();
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
router.delete("/:id", findProduct, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Products.findByIdAndDelete(productId);
    return res.send(product);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Product PATCH Routes...
router.patch(
  "/:id",
  findProductByTitle,
  findProduct,
  validateFields,
  async (req, res) => {
    try {
      const query = new Products({
        _id: res.product._id,

        title: req.body.title || res.product.title,
        description: req.body.description || res.product.description,
        price: req.body.price || res.product.price,
        discountPercentage:
          req.body.discountPercentage || res.product.discountPercentage,
        rating: req.body.rating || res.product.rating,
        stock: req.body.stock || res.product.stock,
        brand: req.body.brand || res.product.brand,
        category: req.body.category || res.product.category,
        images: req.body.images || res.product.images,
      });

      const updatedProduct = await Products.findOneAndUpdate(
        { _id: req.params.id },
        query,
        { new: true }
      );
      res.json(updatedProduct);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

//// Supporting Functions...
// Validate individual field for patch requests
function validateFields(req, res, next) {
  const titleSchema = Joi.string().min(5).max(10).required().label("Title");
  const descriptionSchema = Joi.string()
    .min(10)
    .max(100)
    .required()
    .label("Description");
  const priceSchema = Joi.number().min(5).max(1000).required().label("Price");
  const discountPercentageSchema = Joi.number().label("Discount Percentage");
  const ratingSchema = Joi.number().label("Rating");
  const stockSchema = Joi.number().label("Stock");
  const brandSchema = Joi.string().min(5).max(30).required().label("Brand");
  const categorySchema = Joi.string()
    .min(5)
    .max(30)
    .required()
    .label("Category");
  const imagesSchema = Joi.array().label("Images");

  let result;
  if (req.body.title && titleSchema.validate(req.body.name).error) {
    result = {
      ...result,
      title: titleSchema.validate(req.body.name).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (
    req.body.description &&
    descriptionSchema.validate(req.body.description).error
  ) {
    result = {
      ...result,
      description: descriptionSchema.validate(req.body.description).error
        ?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (req.body.price && priceSchema.validate(req.body.price).error) {
    result = {
      ...result,
      price: priceSchema.validate(req.body.title).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (
    req.body.discountPercentage &&
    discountPercentageSchema.validate(req.body.discountPercentage).error
  ) {
    result = {
      ...result,
      discountPercentage: discountPercentageSchema.validate(
        req.body.discountPercentage
      ).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (req.body.rating && ratingSchema.validate(req.body.rating).error) {
    result = {
      ...result,
      rating: ratingSchema.validate(req.body.rating).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (req.body.stock && stockSchema.validate(req.body.stock).error) {
    result = {
      ...result,
      stock: stockSchema.validate(req.body.stock).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (req.body.brand && brandSchema.validate(req.body.brand).error) {
    result = {
      ...result,
      brand: brandSchema.validate(req.body.brand).error?.details[0].message,
    };
    return res.status(400).send(result);
  }
  if (req.body.category && categorySchema.validate(req.body.category).error) {
    result = {
      ...result,
      category: categorySchema.validate(req.body.category).error?.details[0]
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
// To find product for given _id
async function findProduct(req, res, next) {
  let product;
  try {
    let id = req.params.id;
    product = await Products.findById(id);
    if (!product || product === null)
      return res.status(404).send(`Product with the id ${id} was not found`);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  req.product = product;
  res.product = product;
  next();
}
// To check if product for given Email exists
async function findProductByTitle(req, res, next) {
  let product;
  try {
    let title = req.body.title;
    product = await Products.find({ title });
    console.log("##########", product, title);
    if (product && product.length !== 0) {
      return res
        .status(404)
        .send(`Product with the title ${title} already exists!`);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  req.product = product;
  res.product = product;
  next();
}

module.exports = router;
