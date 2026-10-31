const { bot, env, safe, putBackSlash } = require("./bot");
const { manualReplyButtons } = require("./keyboards");
const { get, set, clear, updateById, getById } = require("./mutations");
const { isExist, sendToAdmin, sendPendingProducts } = require("./messaging");
const { getAllAnsweredProducts } = require("./upload_archive");

// Paylaşılan admin durumu (message handler kapsamında yaşar).
const state = {
    stop: false,
    restTime: undefined,
    timeOut: undefined,
};

// /stop ve /start admin komutları.
const handleAdminStopStart = (msg) => {
    if (msg.text === "/stop" && msg.chat.id == env.adminId) state.stop = true;
    if (msg.text === "/start" && msg.chat.id == env.adminId) state.stop = false;
};

// Bot dururken gelen mesajlara uyarı gönder.
const handleStoppedMessage = (msg) => {
    safe(
        bot.sendMessage(
            msg.chat.id,
            "Malesef admin birkaç gün müsait değil. O yüzden istek alamıyorum. Son güncellemeleri Halal Border kanalından takip edebilirsiniz. Anlayışınız için teşekkürler🙏"
        ),
        "stopped notify"
    );
};

// /sus N  →  N dk'lık sessiz mod; 0 ise anında beklemedeki ürünleri yollar.
const handleSusCommand = async (msg) => {
    const request = parseInt(
        msg.text.slice(msg.text.indexOf("/sus") + 5, msg.text.length).trim()
    );

    if (request) {
        state.restTime = request;
        safe(
            bot.sendMessage(env.adminId, request + "dk sonra görüşürüz abi 👋"),
            "sus ack"
        );
        state.timeOut = setTimeout(async () => {
            await sendPendingProducts();
        }, request * 60 * 1000);
    } else if (request === 0) {
        state.restTime = false;
        clearTimeout(state.timeOut);
        await sendPendingProducts();
    }
};

// /gonder  →  cevaplanmış ürünleri toplu halde kanala yollar.
const handleGonderCommand = async () => {
    const answeredProducts = await getAllAnsweredProducts();

    if (answeredProducts.length === 0) {
        safe(
            bot.sendMessage(env.adminId, "Cevaplanan ürün bulunamadı."),
            "gonder empty"
        );
        return;
    }

    for (let i = 0; i < answeredProducts.length; i++) {
        const html =
            "Ürün: " +
            putBackSlash(answeredProducts[i].productName || "") +
            "\r\nMarket: " +
            putBackSlash(answeredProducts[i].marketName || "") +
            "\nCevap: " +
            putBackSlash(answeredProducts[i].answer || "Cevap bulunamadı");

        const mediaGroup = [
            { type: "photo", media: answeredProducts[i].ingredients },
            { type: "photo", media: answeredProducts[i].frontImage },
            {
                type: "photo",
                media: answeredProducts[i].barcode,
                caption: html,
                parse_mode: "MarkdownV2",
            },
        ];

        try {
            await bot.sendMediaGroup(env.groupId, mediaGroup);
        } catch (err) {
            console.log("Error sending media group:", err);
            continue;
        }
    }

    safe(
        bot.sendMessage(env.adminId, "Cevaplanan ürünler kanala gönderildi."),
        "gonder done"
    );
};

// Admin, admin'e gelen ürün mesajına manuel yazılı cevap verdiğinde.
const handleAdminReply = async (msg) => {
    const replyText = msg.reply_to_message.text;

    const replyChatId = replyText.slice(
        replyText.indexOf("Chat ID: ") + 9,
        replyText.indexOf("Chat ID: ") + 25
    );
    const replyProductName = replyText.slice(
        replyText.indexOf("Ürün: ") + 5,
        replyText.indexOf("Market:")
    );
    const replyMarketName = replyText.slice(
        replyText.indexOf("Market: ") + 7,
        replyText.indexOf("Açıklama:")
    );
    const db =
        replyText.indexOf("DB:") > -1
            ? replyText.slice(replyText.indexOf("DB:") + 3, replyText.length)
            : null;

    const html =
        "Ürün: " +
        putBackSlash(replyProductName) +
        "\n Market: " +
        putBackSlash(replyMarketName) +
        "\nGönderdiğiniz ürünün cevabı:\n" +
        msg.text;

    const product = db ? await getById(db) : null;
    if (product == null) return;

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

    await safe(bot.sendMediaGroup(replyChatId, mediaGroup), "manual reply user");
    await safe(bot.sendMediaGroup(env.groupId, mediaGroup), "manual reply group");
    await safe(
        bot.editMessageReplyMarkup(
            { inline_keyboard: manualReplyButtons(replyText) },
            { chat_id: env.adminId, message_id: msg.reply_to_message.message_id }
        ),
        "manual reply markup"
    );
    await updateById(db, "isAnswered", true);
    await updateById(db, "answer", replyText);
};

// /sor komutu — grup içi ve özel mesaj davranışı farklı.
const handleSorCommand = async (msg) => {
    if (msg.chat.type === env.role) {
        bot
            .sendMessage(msg.chat.id, "Bot'a sormak için tıklayın " + env.botName)
            .then((sentMessage) => {
                safe(bot.deleteMessage(msg.chat.id, msg.message_id), "del /sor");
                setTimeout(() => {
                    safe(
                        bot.deleteMessage(
                            sentMessage.chat.id,
                            sentMessage.message_id
                        ),
                        "del /sor hint"
                    );
                }, 3000);
            })
            .catch((err) => console.log("[/sor]", err && err.message));
        return;
    }

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
};

// Ürün tüm gerekli alanlara sahip mi?
const isProductComplete = (p) =>
    p.chatId &&
    p.userId &&
    p.productName &&
    p.frontImage &&
    p.ingredients &&
    p.barcode &&
    p.description;

// Adım adım kullanıcı sorma akışı (1 → 6).
const handleProductStep = async (msg) => {
    const current = await get(msg.chat.id);
    switch (current.step) {
        case 1:
            if (!msg.text) {
                safe(
                    bot.sendMessage(
                        msg.chat.id,
                        "Lütfen ürünün ismini yazınız. (etiketteki şekliyle)"
                    ),
                    "step1"
                );
                return;
            }
            await isExist(msg.text, msg.chat.id);
            await set(msg.chat.id, "productName", msg.text);
            return;

        case 2:
            if (!current.frontImage && !msg.photo) {
                safe(
                    bot.sendMessage(
                        msg.chat.id,
                        "Lütfen ürünün ÖN yüzünün fotoğrafını gönderiniz"
                    ),
                    "step2"
                );
                return;
            }
            await set(
                msg.chat.id,
                "frontImage",
                msg.photo[msg.photo.length - 1].file_id
            );
            await set(msg.chat.id, "step", 3);
            safe(
                bot.sendMessage(
                    msg.chat.id,
                    "Lütfen ürünün İÇERİK kısmının fotoğrafını gönderiniz. (okunur şekilde)"
                ),
                "step2 next"
            );
            return;

        case 3:
            if (!current.ingredients && !msg.photo) {
                safe(
                    bot.sendMessage(
                        msg.chat.id,
                        "Lütfen ürünün İÇERİK kısmının fotoğrafını gönderiniz. (okunur şekilde)"
                    ),
                    "step3"
                );
                return;
            }
            await set(
                msg.chat.id,
                "ingredients",
                msg.photo[msg.photo.length - 1].file_id
            );
            await set(msg.chat.id, "step", 4);
            safe(
                bot.sendMessage(msg.chat.id, "Lütfen barkodun fotoğrafını gönderiniz."),
                "step3 next"
            );
            return;

        case 4:
            if (!current.barcode && !msg.photo) {
                safe(
                    bot.sendMessage(
                        msg.chat.id,
                        "Lütfen barkodun fotoğrafını gönderiniz."
                    ),
                    "step4"
                );
                return;
            }
            await set(
                msg.chat.id,
                "barcode",
                msg.photo[msg.photo.length - 1].file_id
            );
            await set(msg.chat.id, "step", 5);
            safe(
                bot.sendMessage(msg.chat.id, "Lütfen ürünün MARKET isimini yazınız."),
                "step4 next"
            );
            return;

        case 5:
            if (!msg.text) {
                safe(
                    bot.sendMessage(msg.chat.id, "Lütfen ürünün MARKET isimini yazınız."),
                    "step5"
                );
                return;
            }
            await set(msg.chat.id, "marketName", msg.text);
            await set(msg.chat.id, "step", 6);
            safe(
                bot.sendMessage(
                    msg.chat.id,
                    "Açıklama ekleyin (istemiyorsanız yok yazıp gönderiniz)"
                ),
                "step5 next"
            );
            return;

        case 6: {
            if (!msg.text) {
                safe(
                    bot.sendMessage(
                        msg.chat.id,
                        "Açıklama ekleyin (istemiyorsanız yok yazıp gönderiniz)"
                    ),
                    "step6"
                );
                return;
            }
            await set(msg.chat.id, "description", msg.text);
            await set(msg.chat.id, "step", 7);

            const latest = await get(msg.chat.id);
            if (!isProductComplete(latest)) {
                safe(
                    bot.sendMessage(msg.chat.id, "Bir hata oluştu lütfen tekrar deneyin 😔"),
                    "step6 incomplete"
                );
                return;
            }

            const idle =
                state.restTime == undefined ||
                state.restTime === false ||
                state.restTime === 0;

            if (idle) {
                await sendToAdmin(latest._id);
                await set(msg.chat.id, "isCompleted", "true");
            } else {
                safe(
                    bot.sendMessage(
                        msg.chat.id,
                        "Ürününüz kaydedildi en kısa zamanda adminlere iletilecektir ve bunun için ayrıca bir bildirim alacaksınız. "
                    ),
                    "step6 queued"
                );
                await set(msg.chat.id, "isCompleted", "true");
            }
            return;
        }
    }
};

const handleMessage = async (msg) => {
    try {
        console.log(msg);

        handleAdminStopStart(msg);

        if (
            state.stop === true &&
            msg.chat.id != env.adminId &&
            msg.chat.id != env.groupId
        ) {
            handleStoppedMessage(msg);
            return;
        }

        // /sus — admin
        if (
            msg.chat.type == env.role &&
            msg.chat.id == env.adminId &&
            msg.text &&
            msg.text.includes("/sus")
        ) {
            await handleSusCommand(msg);
        }

        // /gonder — admin
        if (
            msg.chat.type == env.role &&
            msg.chat.id == env.adminId &&
            msg.text &&
            msg.text.includes("/gonder")
        ) {
            await handleGonderCommand();
            return;
        }

        // Admin elle yazılı reply gönderdi.
        if (
            msg.reply_to_message &&
            msg.reply_to_message.text &&
            msg.chat.id == env.adminId &&
            !msg.media_group_id
        ) {
            await handleAdminReply(msg);
            return;
        }

        // /start — kullanıcı
        if (msg.text && msg.text === "/start") {
            safe(
                bot.sendMessage(
                    msg.chat.id,
                    "Bot çalışıyor! Menu'den yapmak istediğiniz işlemi seçin."
                ),
                "/start"
            );
            return;
        }

        // /sor veya /sor<BotName>
        if (
            msg.text &&
            (msg.text === "/sor" || msg.text == "/sor" + env.botName)
        ) {
            await handleSorCommand(msg);
            return;
        }

        // Akış başlatılmamış — kullanıcıya menüden başlat uyarısı.
        if (msg.chat.type !== env.role) {
            const p = await get(msg.chat.id);
            if (!p.started) {
                console.log("1", p);
                safe(
                    bot.sendMessage(msg.chat.id, "Menu'den bot'u başlatın"),
                    "not started"
                );
                return;
            }
            await handleProductStep(msg);
        }
    } catch (err) {
        console.log("[message handler]", err && err.stack ? err.stack : err);
    }
};

module.exports = { handleMessage };
