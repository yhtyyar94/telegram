require("dotenv").config();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new Schema(
    {
        firstname: { type: String },
        lastname: { type: String },
        username: { type: String },
        chatId: { type: Number },
        answered_product_count: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    "nladmins",
    adminSchema,
    process.env.collection
);
