const ProductsModel = require("../config/productsSchema");
const AdminModel = require("../config/userSchema");
const { bot, env, safe, safeDelete, putBackSlash } = require("./bot");
const { answeredButtons } = require("./keyboards");
const { getById, updateById, set, clear } = require("./mutations");

// admin mesajının metninden Ürün / Market / DB alanlarını çıkarır.
const parseAdminMessageText = (text) => ({
    replyChatId: text.slice(
        text.indexOf("Chat ID: ") + 9,
        text.indexOf("Chat ID: ") + 25
    ),
    replyProductName: text.slice(
        text.indexOf("Ürün: ") + 5,
        text.indexOf("Market:")
    ),
    replyMarketName: text.slice(
        text.indexOf("Market: ") + 7,
        text.indexOf("Açıklama:")
    ),
    db: text.slice(text.indexOf("DB:") + 3, text.length),
});

// "Ürünü sil 🗑️" — admin'in mesaj grubunu siler.
const handleDelete = (query) => {
    safeDelete(env.adminId, query.message.message_id);
    safeDelete(env.adminId, query.message.message_id - 1);
    safeDelete(env.adminId, query.message.message_id - 2);
    safeDelete(env.adminId, query.message.message_id - 3);
};

// Kullanıcı "Evet 👍" dediyse pending ürünü temizler.
const handleExistenceYes = async (query) => {
    await clear(query.message.chat.id, "pending");
    safe(
        bot.sendMessage(
            query.message.chat.id,
            "Yeni bir sorgu için menü'den bot'u başlatın"
        ),
        "existence yes"
    );
};

// Kullanıcı "Hayır 👎" dediyse step'i 2'ye çeker.
const handleExistenceNo = async (query) => {
    await set(query.message.chat.id, "step", 2);
    safe(
        bot.sendMessage(
            query.message.chat.id,
            "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"
        ),
        "existence no"
    );
};

// "Database'a gönder 💿" butonu — kanala yayınlar, admin'deki mesajı siler.
const handleSendToDatabase = (query, product, replyProductName, replyMarketName) => {
    bot
        .sendMessage(env.adminId, "Uygun ürünler kanalına gönderildi. 🚚")
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
            safe(bot.sendMediaGroup(env.database, mediaGroup), "db mediaGroup");
            setTimeout(() => {
                safeDelete(env.adminId, data.message_id);
            }, 3000);
        });
};

// Admin cevap butonuna basınca: kullanıcıya & gruba cevap yollar,
// admin sayacını günceller, mesaj altındaki klavyeyi "cevaplandı" haline getirir.
const handleAdminAnswer = async (query, ctx) => {
    const { db, product, replyChatId, replyProductName, replyMarketName } = ctx;

    console.log("admin", query);

    const pendingProductsCount = await ProductsModel.find({
        isAnswered: false,
        isCompleted: "true",
    }).countDocuments();

    const html =
        "Ürün: " +
        putBackSlash(replyProductName) +
        "\r\nMarket: " +
        putBackSlash(replyMarketName) +
        "\nGönderdiğiniz ürünün cevabı: \n" +
        query.data;

    const htmlForGroup =
        html +
        "\r\n" +
        "Cevaplanmayı bekleyen ürün sayısı: " +
        pendingProductsCount;

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
    const mediaGroupForGroup = [
        { type: "photo", media: product.ingredients },
        { type: "photo", media: product.frontImage },
        {
            type: "photo",
            media: product.barcode,
            caption: htmlForGroup,
            parse_mode: "MarkdownV2",
        },
    ];

    safe(bot.sendMediaGroup(replyChatId, mediaGroup), "reply user media");
    safe(bot.sendMediaGroup(env.groupId, mediaGroupForGroup), "group media");

    const productAnsweredBy = `Cevaplayan: ${query.from.first_name ? query.from.first_name : ""
        } ${query.from.last_name ? query.from.last_name : ""}`;

    const fetchAdmin = await AdminModel.findOne({ chatId: query.from.id });
    if (fetchAdmin) {
        const updatedData = await AdminModel.findByIdAndUpdate(fetchAdmin._id, {
            answered_product_count: fetchAdmin.answered_product_count + 1,
        });
        console.log("data", updatedData);
    } else {
        const admin = new AdminModel({
            firstname: query.from.first_name,
            lastname: query.from.last_name,
            username: query.from.username,
            chatId: query.from.id,
            answered_product_count: 1,
        });
        const savedData = await admin.save();
        console.log("data", savedData);
    }

    const currentCount = fetchAdmin
        ? (fetchAdmin.answered_product_count || 0) + 1
        : 1;
    const count = `Toplam Cevap: ${currentCount}`;
    const answer = `Cevap: ${query.data}`;

    safe(
        bot.editMessageReplyMarkup(
            { inline_keyboard: answeredButtons(answer, productAnsweredBy, count) },
            { chat_id: env.adminId, message_id: query.message.message_id }
        ),
        "editReplyMarkup"
    );

    await updateById(db, "isAnswered", true);
    await updateById(db, "answer", query.data);
};

const handleCallbackQuery = async (query) => {
    try {
        console.log("query", query);

        if (query.data === "Ürünü sil 🗑️") {
            handleDelete(query);
            return;
        }
        if (query.data === "Evet 👍") {
            await handleExistenceYes(query);
            return;
        }
        if (query.data === "Hayır 👎") {
            await handleExistenceNo(query);
            return;
        }

        const qText = (query.message && query.message.text) || "";
        if (!qText) return;

        const parsed = parseAdminMessageText(qText);
        console.log("db", parsed.db);
        console.log(query.from.id, parsed.replyProductName);

        const product = await getById(parsed.db);
        console.log("product in query", product);
        if (!product) {
            console.log("[callback] product not found for db", parsed.db);
            return;
        }

        if (query.data === "Database'a gönder 💿") {
            handleSendToDatabase(
                query,
                product,
                parsed.replyProductName,
                parsed.replyMarketName
            );
            return;
        }

        if (query.data === "productAnsweredBy") {
            return;
        }

        // Geri kalan tüm cevap butonları.
        await handleAdminAnswer(query, { ...parsed, product });
    } catch (err) {
        console.log(
            "[callback_query handler]",
            err && err.stack ? err.stack : err
        );
    }
};

module.exports = { handleCallbackQuery };
