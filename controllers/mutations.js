const productsSchema = require("../config/productsSchema");
const ProductsModel = require("../config/productsSchema");

const get = async (chatId, isCompleted = false) => {
  try {
    const res = await ProductsModel.findOne({
      chatId: chatId,
      isCompleted: isCompleted,
    });
    if (res == null) {
      const newProduct = new ProductsModel({
        chatId: chatId,
        userId: chatId,
        isCompleted: false,
      });
      const savedProduct = await newProduct.save();
      return savedProduct;
    } else {
      return res;
    }
  } catch (error) {
    console.log(error);
  }
};

const set = async (chatId, prop, value) => {
  try {
    const today = new Date();
    const res = await ProductsModel.findOne({
      chatId: chatId,
      isCompleted: false,
    });
    console.log(res);
    if (res) {
      if (prop == "imagesUrls") {
        const updatedProduct = await ProductsModel.findByIdAndUpdate(res._id, {
          [prop]: [...res.imagesUrls, value],
        });
        console.log("updated", updatedProduct);
      } else {
        const updatedProduct = await ProductsModel.findByIdAndUpdate(res._id, {
          [prop]: value,
        });
        console.log("updated", updatedProduct);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const clear = async (chatId) => {
  try {
    const res = await ProductsModel.findOne({
      chatId: chatId,
      isCompleted: false,
    });
    if (!res) return;
    const deleteProduct = await ProductsModel.findByIdAndDelete(res._id);
    console.log("delete", deleteProduct);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { get, set, clear };
