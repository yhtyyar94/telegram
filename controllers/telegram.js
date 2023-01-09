require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const mergeImages = require("./jimp");
const fs = require("fs");
const { get, set, clear, fetchData, store } = require("./mutations");
const path = require("path");
const bot = new TelegramBot(process.env.Telegram, {
  polling: true,
});
const adminId = process.env.AdminId;
const groupId = process.env.GroupId;
const botName = process.env.BotName;
const database = process.env.Database;
const role = process.env.role;

const sendToAdmin = async (msg) => {
  const product = await get(msg.chat.id);
  const html =
    "Ürün: " +
    product.productName +
    "\nMarket: " +
    product.marketName +
    "\nAçıklama: " +
    product.description +
    "\nChat ID: " +
    product.chatId +
    "\n[Kullanıcıya mesaj gönder](tg://user?id=" +
    product.userId +
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

  await bot.getFile(product.frontImage).then(async (file) => {
    // Get the image URL
    const imageUrl = `https://api.telegram.org/file/bot${process.env.Telegram}/${file.file_path}`;
    await set(msg.chat.id, "imagesUrls", imageUrl);
  });
  await bot.getFile(product.ingredients).then(async (file) => {
    // Get the image URL
    const imageUrl = `https://api.telegram.org/file/bot${process.env.Telegram}/${file.file_path}`;
    await set(msg.chat.id, "imagesUrls", imageUrl);
  });

  await bot.getFile(product.barcode).then(async (file) => {
    // Get the image URL
    const imageUrl = `https://api.telegram.org/file/bot${process.env.Telegram}/${file.file_path}`;
    await set(msg.chat.id, "imagesUrls", imageUrl);
  });
  const imagesUrls = await get(msg.chat.id);
  const mergedImage = await mergeImages(imagesUrls.imagesUrls);
  await mergedImage.writeAsync(msg.chat.id + "merged.jpg");
  const imageData = fs.readFileSync(msg.chat.id + "merged.jpg");
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
          const dbHtml =
            "Ürün: " + replyProductName + "\r\nMarket: " + replyMarketName;
          bot.sendPhoto(database, replyImageId, {
            caption: dbHtml,
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

  let restTime;
  let timeOut;
  bot.on("message", async (msg) => {
    console.log(msg);
    console.log(store);

    // set rest time

    if (
      msg.chat.type == "group" &&
      msg.chat.id == adminId &&
      msg.text.includes("/sus")
    ) {
      const request = parseInt(
        msg.text.slice(msg.text.indexOf("/sus") + 5, msg.text.length).trim()
      );

      if (request) {
        restTime = new Date().getTime() + request * 60 * 1000;
        bot.sendMessage(adminId, request + "dk sonra görüşürüz abi 👋");
      } else if (request == 0) {
        console.log(request);
        restTime = false;
        clearTimeout(timeOut);
      }
    }

    //reset restTime
    if (restTime <= new Date().getTime()) {
      restTime = false;
    }

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
      if (msg.chat.type === role) {
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
        await set(msg.chat.id, "isCompleted", true);
        await clear(msg.chat.id);
        await get(msg.chat.id);
        await set(msg.chat.id, "userId", msg.from.id);
        await set(msg.chat.id, "started", true);
        await set(msg.chat.id, "step", 1);
      }
    } else if (!(await get(msg.chat.id)).started && msg.chat.type !== role) {
      bot.sendMessage(msg.chat.id, "Menu'den bot'u başlatın");
      return;
    } else if (msg.chat.type !== role) {
      if (!(await get(msg.chat.id)).started) {
        bot.sendMessage(msg.chat.id, "Menu'den bot'u başlatın");
        return;
      }

      switch ((await get(msg.chat.id)).step) {
        case 1:
          if (!msg.text) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün ismini yazınız. (etiketteki şekliyle)"
            );
            return;
          } else {
            await set(msg.chat.id, "productName", msg.text);
            await set(msg.chat.id, "step", 2);
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"
            );
          }
          break;
        case 2:
          if (!(await get(msg.chat.id).frontImage) && !msg.photo) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"
            );
            return;
          } else {
            await set(
              msg.chat.id,
              "frontImage",
              msg.photo[msg.photo.length - 1].file_id
            );
            await set(msg.chat.id, "step", 3);
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün İÇERİK kısmının fotoğrafını gönderiniz. (okunur şekilde)"
            );
          }
          break;
        case 3:
          if (!(await get(msg.chat.id).ingredients) && !msg.photo) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen ürünün İÇERİK kısmının fotoğrafını gönderiniz. (okunur şekilde)"
            );
            return;
          } else {
            await set(
              msg.chat.id,
              "ingredients",
              msg.photo[msg.photo.length - 1].file_id
            );
            await set(msg.chat.id, "step", 4);
            bot.sendMessage(
              msg.chat.id,
              "Lütfen barkodun fotoğrafını gönderiniz."
            );
          }
          break;
        case 4:
          if (!(await get(msg.chat.id).barcode) && !msg.photo) {
            bot.sendMessage(
              msg.chat.id,
              "Lütfen barkodun fotoğrafını gönderiniz."
            );
            return;
          } else {
            await set(
              msg.chat.id,
              "barcode",
              msg.photo[msg.photo.length - 1].file_id
            );
            await set(msg.chat.id, "step", 5);
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
            await set(msg.chat.id, "marketName", msg.text);
            await set(msg.chat.id, "step", 6);
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
            await set(msg.chat.id, "description", msg.text);
            await set(msg.chat.id, "step", 7);
            const product = await get(msg.chat.id);
            if (
              product.chatId &&
              product.userId &&
              product.productName &&
              product.frontImage &&
              product.ingredients &&
              product.barcode &&
              product.description
            ) {
              if (restTime == undefined || restTime == false || restTime == 0) {
                await sendToAdmin(msg);
                await clear(msg.chat.id);
                fs.unlink(
                  "/Users/user/Documents/GitHub/telegram/" +
                    msg.chat.id +
                    "merged.jpg",
                  (err) => {
                    console.log(err);
                  }
                );
              } else {
                bot.sendMessage(
                  msg.chat.id,
                  "Ürününüz kaydedildi en kısa zamanda adminlere iletilecektir ve bunun için ayrıca bir bildirim alacaksınız. "
                );
                const currentTime = new Date().getTime();

                // Calculate the difference in milliseconds
                const timeDifference = restTime - currentTime;
                timeOut = setTimeout(async () => {
                  await sendToAdmin(msg);
                  await clear(msg.chat.id);
                  fs.unlink(
                    "/Users/user/Documents/GitHub/telegram/" +
                      msg.chat.id +
                      "merged.jpg",
                    (err) => {
                      console.log(err);
                    }
                  );
                }, timeDifference);
              }
            } else {
              bot.sendMessage(
                msg.chat.id,
                "Bir hata oluştu lütfen tekrar deneyin 😔"
              );
            }
          }
          break;
      }
    }
  });
};

module.exports = telegramBot;
