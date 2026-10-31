const Products = require("../config/productsSchema");

// Cevaplanmış tüm ürünleri döner. Hata halinde boş dizi.
const getAllAnsweredProducts = async () => {
    try {
        return await Products.find({ isAnswered: true });
    } catch (error) {
        console.log("[getAllAnsweredProducts]", error && error.message);
        return [];
    }
};

module.exports = {
    getAllAnsweredProducts,
};