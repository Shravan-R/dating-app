const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "dating_app.db");

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error("❌ SQLite connection failed:", err.message);
  } else {
    console.log("✅ SQLite database connected");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      age INTEGER,
      gender TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      from_user INTEGER,
      to_user INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      user1 INTEGER,
      user2 INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      sender INTEGER,
      receiver INTEGER,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
