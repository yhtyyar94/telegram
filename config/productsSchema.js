const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductsSchema = new Schema(
  {
    chatId: { type: Number },
    step: { type: Number },
    started: { type: Boolean },
    userId: { type: Number },
    productName: { type: String },
    frontImage: { type: String },
    ingredients: { type: String },
    barcode: { type: String },
    marketName: { type: String },
    description: { type: String },
    imagesUrls: { type: Array },
    isCompleted: { type: Boolean },
  },
  { timestamps: true }
);

module.exports = mongoose.model("product", ProductsSchema);
