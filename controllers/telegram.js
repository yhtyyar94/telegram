require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { get, set, clear, updateById, getById } = require("./mutations");
const ProductsModel = require("../config/productsSchema");
const bot = new TelegramBot(process.env.Telegram, {
  polling: true,
});
const adminId = process.env.AdminId;
const groupId = process.env.GroupId;
const botName = process.env.BotName;
const database = process.env.Database;
const role = process.env.role;

const putBackSlash = (text) => {
  const symbols = [
    "_",
    "*",
    "[",
    "]",
    "(",
    ")",
    "~",
    "`",
    ">",
    "#",
    "+",
    "-",
    "=",
    "|",
    "{",
    "}",
    ".",
    "!",
  ];
  let result = "";
  for (let i = 0; i < text.length; i++) {
    if (symbols.indexOf(text[i]) == -1) {
      result += text[i];
    } else {
      result += "\\" + text[i];
    }
  }

  return result;
};

const isExist = async (query, chatId) => {
  const products = await ProductsModel.find({
    productName: { $regex: query, $options: "i" },
  });
  if (products.length > 0) {
    for (let i = 0; i < products.length; i++) {
      const html =
        "Ürün: " +
        putBackSlash(products[i].productName) +
        "\r\nMarket: " +
        putBackSlash(products[i].marketName) +
        "\nGönderdiğiniz ürünün cevabı: \n" +
        putBackSlash(products[i].answer);

      const mediaGroup = [
        { type: "photo", media: products[i].ingredients },
        { type: "photo", media: products[i].frontImage },
        {
          type: "photo",
          media: products[i].barcode,
          caption: html,
          parse_mode: "MarkdownV2",
        },
      ];

      await bot.sendMediaGroup(chatId, mediaGroup);
    }
    const isExist = [
      [
        {
          text: "Evet 👍",
          callback_data: "Evet 👍",
        },
        {
          text: "Hayır 👎",
          callback_data: "Hayır 👎",
        },
      ],
    ];
    bot.sendMessage(
      chatId,
      "(Eğer ürününüz yukarıdakiler arasında varsa ama cevabı undefined ise ürünü lütfen Halalborder Hollanda kanalında aratın cevabı orada vardır). Yukarıdakilerden birisi sizin aradığınız ürün mü? ",
      { reply_markup: { inline_keyboard: isExist } }
    );
  } else {
    await set(chatId, "step", 2);
    bot.sendMessage(chatId, "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz");
  }
};

const sendToAdmin = async (id) => {
  const product = await getById(id);
  const html =
    "Ürün: " +
    putBackSlash(product.productName) +
    "\nMarket: " +
    putBackSlash(product.marketName) +
    "\nAçıklama: " +
    putBackSlash(product.description) +
    "\nChat ID: " +
    product.chatId +
    "\n[Kullanıcıya mesaj gönder](tg://user?id=" +
    product.userId +
    ")" +
    "\nDB:" +
    product._id;
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
        text: "Ürün vegatarish mi ve aromalar sorulmalı ❓",
        callback_data: "Ürün vegatarish mi ve aromalar sorulmalı ❓",
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

  bot
    .sendMediaGroup(adminId, [
      { type: "photo", media: product.frontImage },
      { type: "photo", media: product.ingredients },
      {
        type: "photo",
        media: product.barcode,
      },
    ])
    .then((data) => {
      console.log("data", data);
      bot.sendMessage(adminId, html, {
        parse_mode: "MarkdownV2",
        reply_markup: { inline_keyboard: buttons },
      });
    })
    .catch((err) => {
      console.log(err);
    });
  bot.sendMessage(product.chatId, "İsteğiniz adminlere iletildi ⏱️");
};

const sendPendingProducts = async () => {
  try {
    const all = await ProductsModel.find({
      isAnswered: false,
      isCompleted: "true",
    });
    if (all.length != 0) {
      for (let i = 0; i < all.length; i++) {
        sendToAdmin(all[i]._id)
          .then(async (data) => {
            await updateById(all[i]._id, "isAnswered", true);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const telegramBot = () => {
  const commands = [
    {
      command: "/sor",
      description: `Ürün sormak için bu komuta tıklayın.`,
    },
  ];

  bot.setMyCommands(commands);

  bot.on("callback_query", async (query) => {
    console.log("query", query);
    if (query.data == "Ürünü sil 🗑️") {
      bot.deleteMessage(adminId, query.message.message_id);
      bot.deleteMessage(adminId, query.message.message_id - 1);
      bot.deleteMessage(adminId, query.message.message_id - 2);
      bot.deleteMessage(adminId, query.message.message_id - 3);
      return;
    }

    if (query.data == "Evet 👍") {
      await clear(query.message.chat.id, "pending");
      bot.sendMessage(
        query.message.chat.id,
        "Yeni bir sorgu için menü'den bot'u başlatın"
      );
      return;
    }

    if (query.data == "Hayır 👎") {
      await set(query.message.chat.id, "step", 2);
      bot.sendMessage(
        query.message.chat.id,
        "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"
      );

      return;
    }

    const replyChatId = query.message.text.slice(
      query.message.text.indexOf("Chat ID: ") + 9,
      query.message.text.indexOf("Chat ID: ") + 25
    );
    const replyProductName = query.message.text.slice(
      query.message.text.indexOf("Ürün: ") + 5,
      query.message.text.indexOf("Market:")
    );

    const replyMarketName = query.message.text.slice(
      query.message.text.indexOf("Market: ") + 7,
      query.message.text.indexOf("Açıklama:")
    );
    const db = query.message.text.slice(
      query.message.text.indexOf("DB:") + 3,
      query.message.text.length
    );
    console.log("db", db);
    const html =
      "Ürün: " +
      putBackSlash(replyProductName) +
      "\r\nMarket: " +
      putBackSlash(replyMarketName) +
      "\nGönderdiğiniz ürünün cevabı: \n" +
      query.data;

    console.log(query.from.id, replyProductName);

    const product = await getById(db);
    console.log("product in query", product);

    const mediaGroup = [
      { type: "photo", media: product.ingredients },
      { type: "photo", media: product.frontImage },
      {
        type: "photo",
        media: product.barcode,
        caption: html,
        parse_mode: "MarkdownV2",
      },
    ];

    if (query.data == "Database'a gönder 💿") {
      bot
        .sendMessage(adminId, "Uygun ürünler kanalına gönderildi. 🚚")
        .then((data) => {
          const html =
            "Ürün: " +
            putBackSlash(replyProductName) +
            "\r\nMarket: " +
            putBackSlash(replyMarketName);
          const mediaGroup = [
            { type: "photo", media: product.ingredients },
            { type: "photo", media: product.frontImage },
            {
              type: "photo",
              media: product.barcode,
              caption: html,
              parse_mode: "MarkdownV2",
            },
          ];
          bot.sendMediaGroup(database, mediaGroup);
          setTimeout(() => {
            bot.deleteMessage(adminId, data.message_id);
          }, 3000);
        });
    } else if (query.data != "Ürünü sil 🗑️") {
      bot.sendMediaGroup(replyChatId, mediaGroup);
      bot.sendMediaGroup(groupId, mediaGroup);
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
      await updateById(db, "isAnswered", true);
      await updateById(db, "answer", query.data);
    }
    return;
  });

  let restTime;
  let timeOut;
  bot.on("message", async (msg) => {
    console.log(msg);
    const product = await get(msg.chat.id);

    // set rest time

    if (
      msg.chat.type == role &&
      msg.chat.id == adminId &&
      msg.text.includes("/sus")
    ) {
      const request = parseInt(
        msg.text.slice(msg.text.indexOf("/sus") + 5, msg.text.length).trim()
      );

      if (request) {
        restTime = request;
        bot.sendMessage(adminId, request + "dk sonra görüşürüz abi 👋");
        timeOut = setTimeout(async () => {
          await sendPendingProducts();
        }, request * 60 * 1000);
      } else if (request == 0) {
        restTime = false;
        clearTimeout(timeOut);
        await sendPendingProducts();
      }
    }

    if (msg.reply_to_message && msg.chat.id == adminId && !msg.media_group_id) {
      const replyChatId = msg.reply_to_message.text.slice(
        msg.reply_to_message.text.indexOf("Chat ID: ") + 9,
        msg.reply_to_message.text.indexOf("Chat ID: ") + 25
      );
      const replyProductName = msg.reply_to_message.text.slice(
        msg.reply_to_message.text.indexOf("Ürün: ") + 5,
        msg.reply_to_message.text.indexOf("Market:")
      );
      const replyMarketName = msg.reply_to_message.text.slice(
        msg.reply_to_message.text.indexOf("Market: ") + 7,
        msg.reply_to_message.text.indexOf("Açıklama:")
      );
      const db = msg.reply_to_message.text.slice(
        msg.reply_to_message.text.indexOf("DB:") + 3,
        msg.reply_to_message.text.length
      );
      const html =
        "Ürün: " +
        putBackSlash(replyProductName) +
        "\n Market: " +
        putBackSlash(replyMarketName) +
        "\nGönderdiğiniz ürünün cevabı:\n" +
        putBackSlash(msg.text);

      const product = await getById(db);

      if (product == null) {
        bot
          .sendMessage(
            adminId,
            "Bu mesaja cevap verdiniz o yüzden database'den silindi, tekrar cevap verme özelliği istiyorsanız geliştiricimle iletişime geçin ⚠️"
          )
          .then((sentMsg) => {
            setTimeout(() => {
              bot.deleteMessage(adminId, msg.message_id);
              bot.deleteMessage(adminId, sentMsg.message_id);
            }, 7000);
          });
        return;
      }

      const mediaGroup = [
        { type: "photo", media: product.ingredients },
        { type: "photo", media: product.frontImage },
        {
          type: "photo",
          media: product.barcode,
          caption: html,
          parse_mode: "MarkdownV2",
        },
      ];

      bot.sendMediaGroup(replyChatId, mediaGroup);
      bot.sendMediaGroup(groupId, mediaGroup);
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
      await updateById(db, "isAnswered", true);
      await updateById(db, "answer", msg.reply_to_message.text);

      setTimeout(() => {
        bot.deleteMessage(adminId, msg.message_id);
      }, 3000);

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
        await clear(msg.chat.id, "pending");
        await get(msg.chat.id);
        await set(msg.chat.id, "isCompleted", "pending");
        await set(msg.chat.id, "userId", msg.from.id);
        await set(msg.chat.id, "started", true);
        await set(msg.chat.id, "step", 1);
      }
    } else if (!(await get(msg.chat.id)).started && msg.chat.type !== role) {
      console.log("1", await get(msg.chat.id));
      bot.sendMessage(msg.chat.id, "Menu'den bot'u başlatın");
      return;
    } else if (msg.chat.type !== role) {
      if (!(await get(msg.chat.id)).started) {
        console.log("2", await get(msg.chat.id));
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
            await isExist(msg.text, msg.chat.id);
            await set(msg.chat.id, "productName", msg.text);
          }
          break;
        case 2:
          if (!(await get(msg.chat.id)).frontImage && !msg.photo) {
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
          if (!(await get(msg.chat.id)).ingredients && !msg.photo) {
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
          if (!(await get(msg.chat.id)).barcode && !msg.photo) {
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
            if (
              (await get(msg.chat.id)).chatId &&
              (await get(msg.chat.id)).userId &&
              (await get(msg.chat.id)).productName &&
              (await get(msg.chat.id)).frontImage &&
              (await get(msg.chat.id)).ingredients &&
              (await get(msg.chat.id)).barcode &&
              (await get(msg.chat.id)).description
            ) {
              if (restTime == undefined || restTime == false || restTime == 0) {
                await sendToAdmin((await get(msg.chat.id))._id);
                await set(msg.chat.id, "isCompleted", "true");
              } else {
                bot.sendMessage(
                  msg.chat.id,
                  "Ürününüz kaydedildi en kısa zamanda adminlere iletilecektir ve bunun için ayrıca bir bildirim alacaksınız. "
                );

                await set(msg.chat.id, "isCompleted", "true");
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
