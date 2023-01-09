const mongoose = require("mongoose");
require("dotenv").config();

/**Create .env file in backend folder and add your mongodb connection as db_connection**/

module.exports = () => {
  mongoose.set("strictQuery", false);
  mongoose.connect(process.env.db_connection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose.connection.on("open", () => {
    console.log("Connected to Database");
  });
  mongoose.connection.on("error", (err) => {
    console.log("DB connection failed" + err);
  });
};
