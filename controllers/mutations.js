const ProductsModel = require("../config/productsSchema");

const getById = async (id) => {
  try {
    const res = await ProductsModel.findById(id).exec();
    return res;
  } catch (error) {
    console.log(error);
  }
};

const get = async (chatId, isCompleted = "pending") => {
  try {
    const res = await ProductsModel.findOne({
      chatId: chatId,
      isCompleted: isCompleted,
    });
    if (res == null) {
      const newProduct = new ProductsModel({
        chatId: chatId,
        userId: chatId,
        isCompleted: "pending",
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

const updateById = async (id, prop, value) => {
  try {
    const res = await ProductsModel.findByIdAndUpdate(id, {
      [prop]: value,
    });
    return res;
  } catch (error) {
    console.log(error);
  }
};

const set = async (chatId, prop, value) => {
  try {
    const res = await ProductsModel.findOne({
      chatId: chatId,
      isCompleted: "pending",
    });
    console.log("findId", res);
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

const del = async (id) => {
  try {
    const res = await ProductsModel.findByIdAndDelete(id);
    return res;
  } catch (error) {
    console.log(error);
  }
};

const clear = async (chatId, status) => {
  try {
    const res = await ProductsModel.findOne({
      chatId: chatId,
      isCompleted: status,
    });
    console.log("clear", res);
    if (!res) return;
    const deleteProduct = await ProductsModel.findByIdAndDelete(res._id);
    console.log("delete", deleteProduct);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { get, set, clear, getById, del, updateById };
