const { bot } = require("./bot");
const { handleCallbackQuery } = require("./callbackHandler");
const { handleMessage } = require("./messageHandler");

const commands = [
  { command: "/sor", description: "Ürün sormak için bu komuta tıklayın." },
];

// server.js bunu bir kez çağırıyor ve tüm Telegram dinleyicilerini kurar.
const telegramBot = () => {
  bot.setMyCommands(commands);
  bot.on("callback_query", handleCallbackQuery);
  bot.on("message", handleMessage);
};

module.exports = telegramBot;
