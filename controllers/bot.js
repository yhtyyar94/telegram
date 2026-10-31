require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.Telegram, {
    polling: {
        interval: 5000,
        params: {
            timeout: 10,
        },
    },
    request: {
        family: 4,
        timeout: 30000,
    },
});

const env = {
    adminId: process.env.AdminId,
    groupId: process.env.GroupId,
    botName: process.env.BotName,
    database: process.env.Database,
    role: process.env.role,
};

bot.on("polling_error", (error) => {
    console.log(
        "[polling_error]",
        new Date().toISOString(),
        error && error.code,
        error && error.message
    );
});
bot.on("webhook_error", (error) => {
    console.log("[webhook_error]", error && error.message);
});
bot.on("error", (error) => {
    console.log("[bot_error]", error && error.message);
});

// Telegram API çağrılarının reject olması tüm süreci öldürmesin diye.
// Kullanıcı botu block ettiyse (403), mesaj bulunamazsa (400) vs. sessizce logla.
const safe = (promise, label) =>
    Promise.resolve(promise).catch((err) => {
        console.log("[tg_api]", label || "", err && err.message);
        return null;
    });

const safeDelete = (chatId, messageId) =>
    safe(bot.deleteMessage(chatId, messageId), "deleteMessage");

// MarkdownV2 için özel karakterleri escape eder.
const putBackSlash = (text) => {
    const symbols = [
        "_", "*", "[", "]", "(", ")", "~", "`", ">", "#",
        "+", "-", "=", "|", "{", "}", ".", "!",
    ];
    let result = "";
    const src = text || "";
    for (let i = 0; i < src.length; i++) {
        result += symbols.indexOf(src[i]) === -1 ? src[i] : "\\" + src[i];
    }
    return result;
};

module.exports = { bot, env, safe, safeDelete, putBackSlash };
