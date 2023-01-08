require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const mergeImages = require("./jimp");
const fs = require("fs");
const { get, set, clear, fetchData } = require("./mutations");
const bot = new TelegramBot(process.env.Telegram, {
  polling: true,
});
const adminId = process.env.AdminId;
const groupId = process.env.GroupId;
const botName = process.env.BotName;
const database = process.env.Database;

const sendToAdmin = async (msg) => {
  const html =
    "Ürün: " +
    get(msg.chat.id).productName +
    "\nMarket: " +
    get(msg.chat.id).marketName +
    "\nAçıklama: " +
    get(msg.chat.id).description +
    "\nChat ID: " +
    get(msg.chat.id).chatId +
    "\n[Kullanıcıya mesaj gönder](tg://user?id=" +
    get(msg.chat.id).userId +
    ")";
  const buttons = [
    [
      {
        text: "Uygun ✅",
        callback_data: "Uygun ✅",
      },
      {
        text: "Şüpheli ⁉️",
        callback_data: "Şüpheli ⁉️",
      },
    ],
    [
      {
        text: "Aroma sorulmalı ❓",
        callback_data: "Aroma sorulmalı ❓",
      },
    ],
    [
      {
        text: "Extract sorulmalı ❓",
        callback_data: "Extract sorulmalı ❓",
      },
    ],
    [
      {
        text: "Ürün vegatarish mi sorulmalı ❓",
        callback_data: "Ürün vegatarish mi sorulmalı ❓",
      },
    ],

    [
      {
        text: "Cevap sabit mesajlarda ⬆️",
        callback_data: "Cevap sabit mesajlarda ⬆️",
      },
    ],
    [
      {
        text: "Uygun Değil 🚫",
        callback_data: "Uygun Değil 🚫",
      },
      {
        text: "Haram ⛔️",
        callback_data: "Haram ⛔️",
      },
    ],
    [
      {
        text: "Ürünü sil 🗑️",
        callback_data: "Ürünü sil 🗑️",
      },
    ],
  ];

  await bot.getFile(get(msg.chat.id).frontImage).then((file) => {
    // Get the image URL
    const imageUrl = `https://api.telegram.org/file/bot${process.env.Telegram}/${file.file_path}`;
    set(msg.chat.id, "imagesUrls", imageUrl);
  });
  await bot.getFile(get(msg.chat.id).ingredients).then((file) => {
    // Get the image URL
    const imageUrl = `https://api.telegram.org/file/bot${process.env.Telegram}/${file.file_path}`;
    set(msg.chat.id, "imagesUrls", imageUrl);
  });

  await bot.getFile(get(msg.chat.id).barcode).then((file) => {
    // Get the image URL
    const imageUrl = `https://api.telegram.org/file/bot${process.env.Telegram}/${file.file_path}`;
    set(msg.chat.id, "imagesUrls", imageUrl);
  });
  const mergedImage = await mergeImages(get(msg.chat.id).imagesUrls);
  await mergedImage.writeAsync("merged.jpg");
  const imageData = fs.readFileSync("merged.jpg");
  bot
    .sendPhoto(adminId, imageData, {
      caption: html,
      parse_mode: "MarkdownV2",
      reply_markup: { inline_keyboard: buttons },
    })
    .then((data) => {})
    .catch((err) => {
      bot.sendMessage(msg.chat.id, "Bir hata oluştu lütfen tekrar deneyin 😔");
      console.log(err);
    });
  bot.sendMessage(msg.chat.id, "İsteğiniz adminlere iletildi ⏱️");
};

const telegramBot = () => {
  const commands = [
    {
      command: "/sor",
      description: `Ürün sormak için bu komuta tıklayın.`,
    },
  ];

  bot.setMyCommands(commands);

  bot.on("callback_query", (query) => {
    console.log("query", query);
    const replyUserId = query.message.caption.slice(
      query.message.caption.indexOf("Kullanıcı ID: ") + 14,
      query.message.caption.indexOf("Kullanıcı ID: ") + 25
    );

    const replyChatId = query.message.caption.slice(
      query.message.caption.indexOf("Chat ID: ") + 9,
      query.message.caption.indexOf("Chat ID: ") + 25
    );
    const replyProductName = query.message.caption.slice(
      query.message.caption.indexOf("Ürün: ") + 5,
      query.message.caption.indexOf("Market:")
    );

    const replyMarketName = query.message.caption.slice(
      query.message.caption.indexOf("Market: ") + 7,
      query.message.caption.indexOf("Açıklama:")
    );
    const replyImageId = query.message?.photo?.reverse()[0].file_id;

    const html =
      "Ürün: " +
      replyProductName +
      "\r\nMarket: " +
      replyMarketName +
      "\nGönderdiğiniz ürünün cevabı: \n" +
      query.data;
    if (query.data == "Database'a gönder 💿") {
      bot
        .sendMessage(adminId, "Uygun ürünler kanalına gönderildi. 🚚")
        .then((data) => {
          bot.sendPhoto(database, replyImageId, {
            caption: html,
            parse_mode: "MarkdownV2",
          });
          setTimeout(() => {
            bot.deleteMessage(adminId, data.message_id);
          }, 3000);
        });
    } else if (query.data != "Ürünü sil 🗑️") {
      bot.sendPhoto(replyChatId, replyImageId, {
        caption: html,
        parse_mode: "MarkdownV2",
      });
      bot.sendPhoto(groupId, replyImageId, {
        caption: html,
        parse_mode: "MarkdownV2",
      });
      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [
            [{ text: "Ürünü sil 🗑️", callback_data: "Ürünü sil 🗑️" }],
            [
              {
                text: "Database'a gönder 💿",
                callback_data: "Database'a gönder 💿",
              },
            ],
          ],
        },
        { chat_id: adminId, message_id: query.message.message_id }
      );
    } else if (query.data == "Ürünü sil 🗑️") {
      bot.deleteMessage(adminId, query.message.message_id);
    }
    return;
  });

  bot.on("message", async (msg) => {
    console.log(msg);

    if (msg.reply_to_message && msg.chat.id == adminId) {
      const replyUserId = msg.reply_to_message.caption.slice(
        msg.reply_to_message.caption.indexOf("Kullanıcı ID: ") + 14,
        msg.reply_to_message.caption.indexOf("Kullanıcı ID: ") + 25
      );

      const replyChatId = msg.reply_to_message.caption.slice(
        msg.reply_to_message.caption.indexOf("Chat ID: ") + 9,
        msg.reply_to_message.caption.indexOf("Chat ID: ") + 25
      );
      const replyProductName = msg.reply_to_message.caption.slice(
        msg.reply_to_message.caption.indexOf("Ürün: ") + 10,
        msg.reply_to_message.caption.indexOf("Market:")
      );
      const replyMarketName = msg.reply_to_message.caption.slice(
        msg.reply_to_message.caption.indexOf("Market: ") + 7,
        msg.reply_to_message.caption.indexOf("Açıklama:")
      );
      const replyImageId = msg.reply_to_message?.photo?.reverse()[0].file_id;
      const html =
        "Ürün: " +
        replyProductName +
        "\n Market: " +
        replyMarketName +
        "\nGönderdiğiniz ürünün cevabı:\n" +
        msg.text;

      bot.sendPhoto(replyChatId, replyImageId, {
        caption: html,
        parse_mode: "MarkdownV2",
      });
      bot.sendPhoto(groupId, replyImageId, {
        caption: html,
        parse_mode: "MarkdownV2",
      });
      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [
            [{ text: "Ürünü sil 🗑️", callback_data: "Ürünü sil 🗑️" }],
            [
              {
                text: "Database'a gönder 💿",
                callback_data: "Database'a gönder 💿",
              },
            ],
          ],
        },
        { chat_id: adminId, message_id: msg.reply_to_message.message_id }
      );
      setTimeout(() => {
        bot.deleteMessage(adminId, msg.message_id);
      }, 2000);
      return;
    }

    // users

    if (msg.text && msg.text === "/start") {
      bot.sendMessage(
        msg.chat.id,
        "Bot çalışıyor! Menu'den yapmak istediğiniz işlemi seçin."
      );
    } else if (
      msg.text &&
      (msg.text === "/sor" || msg.text == "/sor" + botName)
    ) {
      if (msg.chat.type === "supergroup") {
        bot
          .sendMessage(groupId, "Bot'a sormak için tıklayın " + botName)
          .then((sentMessage) => {
            bot.deleteMessage(msg.chat.id, msg.message_id);
            setTimeout(() => {
              bot.deleteMessage(msg.chat.id, sentMessage.message_id);
            }, 7000);
          });
      } else {
        await bot.sendMessage(
          msg.chat.id,
          "Ürün sorma sayfasına hoşgeldiniz. Her aşamayı eksiksiz olarak cevap verince ürün adminlere iletilecektir."
        );
        await bot.sendMessage(
          msg.chat.id,
          "Lütfen ürünün ismini yazınız. (etiketteki şekliyle)"
        );
        clear(msg.chat.id);
        await get(msg.chat.id);
        set(msg.chat.id, "userId", msg.from.id);
        set(msg.chat.id, "started", true);
        set(msg.chat.id, "step", 1);
      }
    } else if (!get(msg.chat.id).started && msg.chat.type !== "supergroup") {
      bot.sendMessage(msg.chat.id, "Menu'den bot'u başlatın");
      return;
    } else if (msg.chat.type !== "supergroup") {
      if (!get(msg.chat.id).started) {
        bot.sendMessage(msg.chat.id, "Menu'den bot'u başlatın");
        return;
      }

      switch (get(msg.chat.id).step) {
        case 1:
          if (!msg.text) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün ismini yazınız. (etiketteki şekliyle)"
            );
            return;
          } else {
            set(msg.chat.id, "productName", msg.text);
            set(msg.chat.id, "step", 2);
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"
            );
          }
          break;
        case 2:
          if (!get(msg.chat.id).frontImage && !msg.photo) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"
            );
            return;
          } else {
            set(
              msg.chat.id,
              "frontImage",
              msg.photo[msg.photo.length - 1].file_id
            );
            set(msg.chat.id, "step", 3);
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün İÇERİK kısmının fotoğrafını gönderiniz. (okunur şekilde)"
            );
          }
          break;
        case 3:
          if (!get(msg.chat.id).ingredients && !msg.photo) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün İÇERİK kısmının fotoğrafını gönderiniz. (okunur şekilde)"
            );
            return;
          } else {
            set(
              msg.chat.id,
              "ingredients",
              msg.photo[msg.photo.length - 1].file_id
            );
            set(msg.chat.id, "step", 4);
            bot.sendMessage(
              msg.chat.id,
              "Lütfen barkodun fotoğrafını gönderiniz."
            );
          }
          break;
        case 4:
          if (!get(msg.chat.id).barcode && !msg.photo) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen barkodun fotoğrafını gönderiniz."
            );
            return;
          } else {
            set(
              msg.chat.id,
              "barcode",
              msg.photo[msg.photo.length - 1].file_id
            );
            set(msg.chat.id, "step", 5);
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün MARKET isimini yazınız."
            );
          }
          break;
        case 5:
          if (!msg.text) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün MARKET isimini yazınız."
            );
            return;
          } else {
            set(msg.chat.id, "marketName", msg.text);
            set(msg.chat.id, "step", 6);
            bot.sendMessage(
              msg.chat.id,
              "Açıklama ekleyin (istemiyorsanız yok yazıp gönderiniz)"
            );
          }
          break;
        case 6:
          if (!msg.text) {
            bot.sendMessage(
              msg.chat.id,
              "Açıklama ekleyin (istemiyorsanız yok yazıp gönderiniz)"
            );
            return;
          } else {
            set(msg.chat.id, "description", msg.text);
            set(msg.chat.id, "step", 7);
            if (
              get(msg.chat.id).chatId &&
              get(msg.chat.id).userId &&
              get(msg.chat.id).productName &&
              get(msg.chat.id).frontImage &&
              get(msg.chat.id).ingredients &&
              get(msg.chat.id).barcode &&
              get(msg.chat.id).description
            ) {
              await sendToAdmin(msg);
              clear(msg.chat.id);
            } else {
              bot.sendMessage(
                msg.chat.id,
                "Bir hata oluştu lütfen tekrar deneyin 😔"
              );
              bot.sendMessage(msg.chat.id, "/sor");
            }
          }
          break;
      }
    }
  });
};

module.exports = telegramBot;
