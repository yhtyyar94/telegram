const fs = require("fs");
const path = require("path");

class User {
  constructor(
    chatId,
    step,
    started,
    userId,
    productName,
    frontImage,
    ingredients,
    barcode,
    marketName,
    description,
    imagesUrls = []
  ) {
    this.step = step;
    this.started = started;
    this.chatId = chatId;
    this.userId = userId;
    this.productName = productName;
    this.frontImage = frontImage;
    this.ingredients = ingredients;
    this.barcode = barcode;
    this.marketName = marketName;
    this.description = description;
    this.imagesUrls = imagesUrls;
  }
  getInfo() {
    return {
      step: this.step,
      started: this.started,
      chatId: this.chatId,
      userId: this.userId,
      productName: this.productName,
      frontImage: this.frontImage,
      ingredients: this.ingredients,
      barcode: this.barcode,
      marketName: this.marketName,
      description: this.description,
      imagesUrls: this.imagesUrls,
    };
  }
}

const fetchData = () => {
  const data = fs.readFileSync(path.join(__dirname, "data.json"));
  return JSON.parse(data).filter((item) => item !== null);
};

const get = (chatId) => {
  const info = fetchData();
  let user;

  for (let i = 0; i < info.length; i++) {
    if (info[i] !== null && info[i].chatId == chatId) {
      user = info[i];
      break;
    }
  }
  if (!user) {
    const newUser = new User(chatId).getInfo();
    newUser.imagesUrls = [];
    info.push(newUser);
    fs.writeFileSync(
      path.join(__dirname, "data.json"),
      JSON.stringify(info),
      "utf-8"
    );
    user = newUser;
  }

  return user;
};

const set = (chatId, prop, value) => {
  const info = fetchData();
  if (prop == "imagesUrls") {
    const newInfo = info.map((item, i) => {
      if (item !== null && item.chatId == chatId) {
        item[prop].push(value);
        return item;
      }
    });
    fs.writeFileSync(
      path.join(__dirname, "data.json"),
      JSON.stringify(newInfo),
      "utf-8"
    );
    return;
  }
  if (info.length != 0) {
    const newInfo = info.map((item, i) => {
      if (item !== null && item.chatId == chatId) {
        item[prop] = value;
        return item;
      }
    });
    fs.writeFileSync(
      path.join(__dirname, "data.json"),
      JSON.stringify(newInfo),
      "utf-8"
    );
  }
};

const clear = (chatId) => {
  const info = fetchData();
  const find = info.find((item) => item.chatId == chatId);

  if (find) {
    const updatedInfo = info.filter((item) => item.chatId !== chatId);

    fs.writeFileSync(
      path.join(__dirname, "data.json"),
      JSON.stringify(updatedInfo),
      "utf-8"
    );
  }
};

module.exports = { get, set, clear, fetchData };
