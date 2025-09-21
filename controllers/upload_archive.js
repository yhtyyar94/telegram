// get all answered products from the database
const Products = require("../config/productsSchema");

// Function to get all answered products
const getAllAnsweredProducts = async (onlyUygun=true) => {
    try {
        const answeredProducts = await Products.find({ isAnswered: true, answer: "Uygun ✅" });
        return answeredProducts;
    } catch (error) {
        throw new Error("Error fetching answered products");
    }
};

module.exports = {
    getAllAnsweredProducts,

};