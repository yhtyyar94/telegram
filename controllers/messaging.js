const ProductsModel = require("../config/productsSchema");
const { bot, env, safe, putBackSlash } = require("./bot");
const { existenceButtons, adminProductButtons } = require("./keyboards");
const { getById, updateById, set } = require("./mutations");

// Kullanıcı ürün ismi yazınca eşleşen daha önce cevaplanmış ürünleri gösterir.
const isExist = async (query, chatId) => {
    const products = await ProductsModel.find({
        productName: { $regex: query, $options: "i" },
        isAnswered: true,
    });
    console.log(products);

    if (products.length === 0) {
        await set(chatId, "step", 2);
        safe(
            bot.sendMessage(chatId, "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"),
            "ask front"
        );
        return;
    }

    for (let i = 0; i < products.length; i++) {
        const productAnswer = products[i].answer ? products[i].answer : "";
        const html =
            "Ürün: " +
            putBackSlash(products[i].productName) +
            "\r\nMarket: " +
            putBackSlash(products[i].marketName) +
            "\nGönderdiğiniz ürünün cevabı: \n" +
            productAnswer;

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

        await bot
            .getFile(products[i].frontImage)
            .then(async () => {
                await safe(
                    bot.sendMediaGroup(chatId, mediaGroup),
                    "isExist sendMediaGroup"
                );
            })
            .catch(async (err) => {
                console.log("err", err && err.message);
                if (err) {
                    await ProductsModel.findByIdAndDelete(products[i]._id);
                }
            });
    }

    await safe(
        bot.sendMessage(
            chatId,
            "(Eğer ürününüz yukarıdakiler arasında varsa ama cevabı undefined ise ürünü lütfen Halalborder İsviçre kanalında aratın cevabı orada vardır). Yukarıdakilerden birisi sizin aradığınız ürün mü? ",
            { reply_markup: { inline_keyboard: existenceButtons } }
        ),
        "isExist ask"
    );
};

// Kullanıcı tüm adımları tamamlayınca ürünü admin'e iletir.
const sendToAdmin = async (id) => {
    const product = await getById(id);
    if (!product) {
        console.log("[sendToAdmin] product not found:", id);
        return;
    }

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

    bot
        .sendMediaGroup(env.adminId, [
            { type: "photo", media: product.frontImage },
            { type: "photo", media: product.ingredients },
            { type: "photo", media: product.barcode },
        ])
        .then((data) => {
            console.log("data", data);
            safe(
                bot.sendMessage(env.adminId, html, {
                    parse_mode: "MarkdownV2",
                    reply_markup: { inline_keyboard: adminProductButtons },
                }),
                "sendToAdmin msg"
            );
        })
        .catch((err) => {
            console.log("[sendToAdmin]", err && err.message);
        });

    safe(
        bot.sendMessage(product.chatId, "İsteğiniz adminlere iletildi ⏱️"),
        "iletildi"
    );
};

// /sus süresinden sonra birikmiş ürünleri admin'e topluca yollar.
const sendPendingProducts = async () => {
    try {
        const all = await ProductsModel.find({
            isAnswered: false,
            isCompleted: "true",
        });
        if (all.length === 0) return;

        for (let i = 0; i < all.length; i++) {
            sendToAdmin(all[i]._id)
                .then(async () => {
                    await updateById(all[i]._id, "isAnswered", true);
                })
                .catch((err) => console.log(err));
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = { isExist, sendToAdmin, sendPendingProducts };
