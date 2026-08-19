const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const localdb = process.env.LOCAL_DB || "mongodb://127.0.0.1:27017/Mess_Management?directConnection=true";
mongoose.connect(localdb);

const db = mongoose.connection;

db.on('connected', () => {
  console.log("Server is connected to database successfully.");
});
db.on('disconnected', () => {
  console.log("Server is disconnected from database.");
});
db.on('error', (err) => {
  console.error("Database connection error:", err);
});

module.exports = db;
