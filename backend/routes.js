const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./db");

const router = express.Router();

/* REGISTER */
router.post("/register", async (req, res) => {
  const { name, email, password, age, gender } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const sql =
    "INSERT INTO users (name, email, password, age, gender) VALUES (?, ?, ?, ?, ?)";

  db.run(sql, [name, email, hash, age, gender], err => {
    if (err) {
      return res.status(400).json({ msg: "User already exists" });
    }
    res.json({ msg: "Registered successfully" });
  });
});

/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    res.json({ userId: user.id });
  });
});

module.exports = router;


/* GET USERS FOR DISCOVER */
router.get("/users/:id", (req, res) => {
    const userId = req.params.id;
  
    db.all(
      "SELECT id, name, age, gender FROM users WHERE id != ?",
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
      }
    );
  });
  
  /* LIKE USER */
/* LIKE USER + MATCH CHECK */
router.post("/like", (req, res) => {
    const { fromUser, toUser } = req.body;
  
    // Save like
    db.run(
      "INSERT INTO likes (from_user, to_user) VALUES (?, ?)",
      [fromUser, toUser],
      function (err) {
        if (err) return res.status(500).json(err);
  
        // Check if reverse like exists
        db.get(
          "SELECT * FROM likes WHERE from_user = ? AND to_user = ?",
          [toUser, fromUser],
          (err, row) => {
            if (row) {
              // MATCH FOUND
              db.run(
                "INSERT INTO matches (user1, user2) VALUES (?, ?)",
                [fromUser, toUser]
              );
  
              return res.json({ match: true });
            } else {
              return res.json({ match: false });
            }
          }
        );
      }
    );
  });

  /* CHECK IF MATCHED */
router.get("/isMatched/:user1/:user2", (req, res) => {
    const { user1, user2 } = req.params;
  
    db.get(
      `SELECT * FROM matches 
       WHERE (user1=? AND user2=?) OR (user1=? AND user2=?)`,
      [user1, user2, user2, user1],
      (err, row) => {
        if (row) return res.json({ matched: true });
        res.json({ matched: false });
      }
    );
  });
  
  /* GET MESSAGES */
  router.get("/messages/:user1/:user2", (req, res) => {
    const { user1, user2 } = req.params;
  
    db.all(
      `SELECT * FROM messages 
       WHERE (sender=? AND receiver=?) 
          OR (sender=? AND receiver=?) 
       ORDER BY created_at`,
      [user1, user2, user2, user1],
      (err, rows) => {
        res.json(rows);
      }
    );
  });
  
  /* SEND MESSAGE */
  router.post("/message", (req, res) => {
    const { sender, receiver, message } = req.body;
  
    db.run(
      "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
      [sender, receiver, message],
      () => res.json({ msg: "sent" })
    );
  });
  