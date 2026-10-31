// Admin'e ürün gönderildiğinde görünen cevap butonları.
const adminProductButtons = [
    [
        { text: "Uygun ✅", callback_data: "Uygun ✅" },
        { text: "Şüpheli ⁉️", callback_data: "Şüpheli ⁉️" },
    ],
    [{ text: "Aroma sorulmalı ❓", callback_data: "Aroma sorulmalı ❓" }],
    [{ text: "Extract sorulmalı ❓", callback_data: "Extract sorulmalı ❓" }],
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
            text: "Ürün vegatarish mi ve extractler sorulmalı ❓",
            callback_data: "Ürün vegatarish mi ve extractler sorulmalı ❓",
        },
    ],
    [
        {
            text: "Aroma ve extract sorulmalı ❓",
            callback_data: "Aroma ve extract sorulmalı ❓",
        },
    ],
    [
        {
            text: "Ürün vegatarish mi? Aroma ve extract sorulmalı ❓",
            callback_data: "Ürün vegatarish mi? Aroma ve extract sorulmalı ❓",
        },
    ],
    [
        {
            text: "Ürün şirkete sorulmuş olup UYGUNDUR ✅",
            callback_data: "Ürün şirkete sorulmuş olup UYGUNDUR ✅",
        },
    ],
    [
        {
            text: "Ürün şirkete sorulmuş olup UYGUN DEĞİLDİR 🚫",
            callback_data: "Ürün şirkete sorulmuş olup UYGUN DEĞİLDİR 🚫",
        },
    ],
    [
        {
            text: "Cevap sabit mesajlarda ⬆️",
            callback_data: "Cevap sabit mesajlarda ⬆️",
        },
    ],
    [
        { text: "Uygun Değil 🚫", callback_data: "Uygun Değil 🚫" },
        { text: "Haram ⛔️", callback_data: "Haram ⛔️" },
    ],
    [{ text: "Ürünü sil 🗑️", callback_data: "Ürünü sil 🗑️" }],
];

// isExist akışında kullanıcıya sorulan Evet/Hayır butonları.
const existenceButtons = [
    [
        { text: "Evet 👍", callback_data: "Evet 👍" },
        { text: "Hayır 👎", callback_data: "Hayır 👎" },
    ],
];

// Cevap verildikten sonra admin mesajının altına yerleşen butonlar.
const answeredButtons = (answer, productAnsweredBy, count) => [
    [{ text: answer, callback_data: "productAnsweredBy" }],
    [{ text: productAnsweredBy, callback_data: "productAnsweredBy" }],
    [{ text: count, callback_data: "productAnsweredBy" }],
    [{ text: "Ürünü sil 🗑️", callback_data: "Ürünü sil 🗑️" }],
    [
        {
            text: "Database'a gönder 💿",
            callback_data: "Database'a gönder 💿",
        },
    ],
];

// Manuel reply sonrası admin mesajına yerleşen butonlar.
const manualReplyButtons = (replyText) => [
    [{ text: "Cevap", callback_data: replyText }],
    [{ text: "Ürünü sil 🗑️", callback_data: "Ürünü sil 🗑️" }],
    [
        {
            text: "Database'a gönder 💿",
            callback_data: "Database'a gönder 💿",
        },
    ],
];

module.exports = {
    adminProductButtons,
    existenceButtons,
    answeredButtons,
    manualReplyButtons,
};
