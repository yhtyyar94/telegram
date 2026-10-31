const mongoose = require("mongoose");
require("dotenv").config();

/** Create .env file and set db_connection to your MongoDB URI. **/

module.exports = () => {
  mongoose.set("strictQuery", false);

  const connect = () => {
    mongoose
      .connect(process.env.db_connection, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000,
      })
      .catch((err) => {
        console.log("[db] initial connect failed:", err.message);
      });
  };

  connect();

  mongoose.connection.on("open", () => console.log("[db] connected"));
  mongoose.connection.on("error", (err) =>
    console.log("[db] error:", err && err.message)
  );
  mongoose.connection.on("disconnected", () => {
    console.log("[db] disconnected, retrying in 5s...");
    setTimeout(connect, 5000);
  });
};
