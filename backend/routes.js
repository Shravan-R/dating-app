import express from "express";
import bcrypt from "bcryptjs";
import db from "./db.js";

// Store active SSE connections
const clients = new Map();

const router = express.Router();

// Input validation helper
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, age, gender } = req.body;

    // Validation
    if (!name || !email || !password || !age || !gender) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    if (age < 18 || age > 100) {
      return res.status(400).json({ msg: "Age must be between 18 and 100" });
    }

    const hash = await bcrypt.hash(password, 10);

    const sql =
      "INSERT INTO users (name, email, password, age, gender) VALUES (?, ?, ?, ?, ?)";

    db.run(sql, [name, email, hash, age, gender], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ msg: "User already exists" });
        }
        return res
          .status(500)
          .json({ msg: "Registration failed", error: err.message });
      }
      res.json({ msg: "Registered successfully", userId: this.lastID });
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// LOGIN
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
      if (err) {
        return res
          .status(500)
          .json({ msg: "Server error", error: err.message });
      }

      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      try {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return res.status(400).json({ msg: "Invalid credentials" });
        }

        res.json({ userId: user.id, name: user.name });
      } catch (error) {
        res.status(500).json({ msg: "Server error", error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// GET USER BY ID
router.get("/users/:id", (req, res) => {
  try {
    const userId = req.params.id;

    db.get(
      `SELECT id, name, username, age, gender,
            COALESCE(bio, '') as bio,
            COALESCE(image_url, '') as image_url,
            COALESCE(hobbies, '') as hobbies,
            COALESCE(location, '') as location,
            COALESCE(interests, '') as interests
            FROM users WHERE id=?`,
      [userId],
      (err, user) => {
        if (err) {
          return res
            .status(500)
            .json({ msg: "Server error", error: err.message });
        }
        if (!user) {
          return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
      },
    );
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// GET CURRENT USER (for header/profile)
router.get("/me", (req, res) => {
  try {
    const userId = req.query.userId || req.headers["user-id"];

    if (!userId) {
      return res.status(400).json({ msg: "User ID required" });
    }

    db.get(
      `SELECT id, name, username, email, age, gender,
            COALESCE(bio, '') as bio,
            COALESCE(image_url, '') as image_url,
            COALESCE(hobbies, '') as hobbies,
            COALESCE(location, '') as location,
            COALESCE(interests, '') as interests
            FROM users WHERE id=?`,
      [userId],
      (err, user) => {
        if (err) {
          return res
            .status(500)
            .json({ msg: "Server error", error: err.message });
        }
        if (!user) {
          return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
      },
    );
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// UPDATE USER PROFILE
router.put("/users/:id", (req, res) => {
  try {
    const userId = req.params.id;
    const { username, bio, image_url, hobbies, location, interests } = req.body;

    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }
    if (bio !== undefined) {
      updates.push("bio = ?");
      values.push(bio);
    }
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(image_url);
    }
    if (hobbies !== undefined) {
      updates.push("hobbies = ?");
      values.push(hobbies);
    }
    if (location !== undefined) {
      updates.push("location = ?");
      values.push(location);
    }
    if (interests !== undefined) {
      updates.push("interests = ?");
      values.push(interests);
    }

    if (updates.length === 0) {
      return res.status(400).json({ msg: "No fields to update" });
    }

    values.push(userId);
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

    db.run(sql, values, function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(400).json({ msg: "Username already taken" });
        }
        return res
          .status(500)
          .json({ msg: "Server error", error: err.message });
      }
      res.json({ msg: "Profile updated successfully" });
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// GET USERS FOR DISCOVER (exclude current user and already liked users)
router.get("/discover/:id", (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    // Try to select with bio first, fallback to without bio if column doesn't exist
    db.all(
      `SELECT u.id, u.name, u.username, u.age, u.gender,
              COALESCE(u.bio, '') as bio,
              COALESCE(u.image_url, '') as image_url,
              COALESCE(u.hobbies, '') as hobbies,
              COALESCE(u.location, '') as location,
              COALESCE(u.interests, '') as interests
       FROM users u
       WHERE u.id != ?
       AND u.name IS NOT NULL
       AND u.name != ''
       AND u.id NOT IN (
         SELECT to_user FROM likes WHERE from_user = ?
       )
       ORDER BY u.id DESC
       LIMIT 20`,
      [userId, userId],
      (err, rows) => {
        if (err) {
          // If error is about missing bio column, try without it
          if (err.message && err.message.includes("bio")) {
            console.log("Bio column not found, querying without it...");
            db.all(
              `SELECT u.id, u.name, u.username, u.age, u.gender,
                      '' as bio, '' as image_url, '' as hobbies, '' as location, '' as interests
               FROM users u
               WHERE u.id != ?
               AND u.name IS NOT NULL
               AND u.name != ''
               AND u.id NOT IN (
                 SELECT to_user FROM likes WHERE from_user = ?
               )
               ORDER BY u.id DESC
               LIMIT 20`,
              [userId, userId],
              (err2, rows2) => {
                if (err2) {
                  console.error("Database error:", err2);
                  return res
                    .status(500)
                    .json({ msg: "Server error", error: err2.message });
                }
                res.json(Array.isArray(rows2) ? rows2 : []);
              },
            );
          } else {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ msg: "Server error", error: err.message });
          }
        } else {
          // Ensure we always return an array
          res.json(Array.isArray(rows) ? rows : []);
        }
      },
    );
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// LIKE USER + MATCH CHECK
router.post("/like", (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) {
      return res.status(400).json({ msg: "fromUser and toUser are required" });
    }

    if (fromUser === toUser) {
      return res.status(400).json({ msg: "Cannot like yourself" });
    }

    // Check if already liked
    db.get(
      "SELECT * FROM likes WHERE from_user = ? AND to_user = ?",
      [fromUser, toUser],
      (err, existingLike) => {
        if (err) {
          return res
            .status(500)
            .json({ msg: "Server error", error: err.message });
        }

        if (existingLike) {
          return res.json({ match: false, msg: "Already liked" });
        }

        // Save like
        db.run(
          "INSERT INTO likes (from_user, to_user) VALUES (?, ?)",
          [fromUser, toUser],
          function (err) {
            if (err) {
              return res
                .status(500)
                .json({ msg: "Server error", error: err.message });
            }

            // Check if reverse like exists
            db.get(
              "SELECT * FROM likes WHERE from_user = ? AND to_user = ?",
              [toUser, fromUser],
              (err, row) => {
                if (err) {
                  return res
                    .status(500)
                    .json({ msg: "Server error", error: err.message });
                }

                if (row) {
                  // MATCH FOUND - create match if it doesn't exist
                  db.run(
                    "INSERT OR IGNORE INTO matches (user1, user2) VALUES (?, ?)",
                    [fromUser, toUser],
                    (err) => {
                      if (err) {
                        console.error("Error creating match:", err);
                      }
                    },
                  );

                  return res.json({ match: true, msg: "It's a match!" });
                } else {
                  return res.json({ match: false, msg: "Liked successfully" });
                }
              },
            );
          },
        );
      },
    );
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// DISLIKE/PASS USER
router.post("/dislike", (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) {
      return res.status(400).json({ msg: "fromUser and toUser are required" });
    }

    // Just record that we've seen this user (optional - you can track this separately)
    // For now, we'll just return success
    res.json({ msg: "Passed" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// GET MATCHES FOR USER
router.get("/matches/:userId", (req, res) => {
  try {
    const userId = req.params.userId;

    db.all(
      `SELECT u.id, u.name, u.age, u.gender, COALESCE(u.bio, '') as bio, m.created_at as matched_at
       FROM matches m
       JOIN users u ON (u.id = CASE WHEN m.user1 = ? THEN m.user2 ELSE m.user1 END)
       WHERE m.user1 = ? OR m.user2 = ?
       ORDER BY m.created_at DESC`,
      [userId, userId, userId],
      (err, rows) => {
        if (err) {
          // If error is about missing bio column, try without it
          if (err.message && err.message.includes("bio")) {
            db.all(
              `SELECT u.id, u.name, u.username, u.age, u.gender,
                      '' as bio, '' as image_url, '' as hobbies, '' as location, '' as interests,
                      m.created_at as matched_at
               FROM matches m
               JOIN users u ON (u.id = CASE WHEN m.user1 = ? THEN m.user2 ELSE m.user1 END)
               WHERE m.user1 = ? OR m.user2 = ?
               ORDER BY m.created_at DESC`,
              [userId, userId, userId],
              (err2, rows2) => {
                if (err2) {
                  return res
                    .status(500)
                    .json({ msg: "Server error", error: err2.message });
                }
                res.json(rows2);
              },
            );
          } else {
            return res
              .status(500)
              .json({ msg: "Server error", error: err.message });
          }
        } else {
          res.json(rows);
        }
      },
    );
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// CHECK IF MATCHED
router.get("/isMatched/:user1/:user2", (req, res) => {
  try {
    const { user1, user2 } = req.params;

    db.get(
      `SELECT * FROM matches
       WHERE (user1=? AND user2=?) OR (user1=? AND user2=?)`,
      [user1, user2, user2, user1],
      (err, row) => {
        if (err) {
          return res
            .status(500)
            .json({ msg: "Server error", error: err.message });
        }
        res.json({ matched: !!row });
      },
    );
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// GET MESSAGES
router.get("/messages/:user1/:user2", (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const since = req.query.since; // timestamp or message ID

    let sql = `SELECT id, sender, receiver, message, created_at FROM messages
               WHERE (sender=? AND receiver=?)
                  OR (sender=? AND receiver=?)`;
    let params = [user1, user2, user2, user1];

    if (since) {
      if (!isNaN(since)) {
        // Since timestamp
        sql += ` AND created_at > ?`;
        params.push(since);
      } else {
        // Since message ID
        sql += ` AND id > ?`;
        params.push(since);
      }
    }

    sql += ` ORDER BY created_at ASC`;

    db.all(sql, params, (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ msg: "Server error", error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// SEND MESSAGE
router.post("/message", (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
      return res
        .status(400)
        .json({ msg: "sender, receiver, and message are required" });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ msg: "Message cannot be empty" });
    }

    // Check if users are matched
    db.get(
      `SELECT * FROM matches
       WHERE (user1=? AND user2=?) OR (user1=? AND user2=?)`,
      [sender, receiver, receiver, sender],
      (err, match) => {
        if (err) {
          return res
            .status(500)
            .json({ msg: "Server error", error: err.message });
        }

        if (!match) {
          return res
            .status(403)
            .json({ msg: "Users must be matched to send messages" });
        }

        db.run(
          "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
          [sender, receiver, message.trim()],
          function (err) {
            if (err) {
              return res
                .status(500)
                .json({ msg: "Server error", error: err.message });
            }

            // Get the inserted message with timestamp
            db.get(
              "SELECT id, sender, receiver, message, created_at FROM messages WHERE id = ?",
              [this.lastID],
              (err, message) => {
                if (!err && message) {
                  // Broadcast to SSE clients
                  broadcastMessage(sender, receiver, message);
                }
              }
            );

            res.json({ msg: "sent", messageId: this.lastID });
          },
        );
      },
    );
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

// SERVER-SENT EVENTS FOR REAL-TIME MESSAGES
router.get("/messages/stream/:user1/:user2", (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const clientId = `${user1}-${user2}`;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Store client connection
    clients.set(clientId, res);

    // Handle client disconnect
    req.on('close', () => {
      clients.delete(clientId);
    });

  } catch (error) {
    console.error("SSE error:", error);
    res.status(500).end();
  }
});

// Helper function to broadcast messages to clients
function broadcastMessage(user1, user2, message) {
  const clientId1 = `${user1}-${user2}`;
  const clientId2 = `${user2}-${user1}`;

  [clientId1, clientId2].forEach(clientId => {
    const client = clients.get(clientId);
    if (client) {
      client.write(`data: ${JSON.stringify({
        type: 'new_message',
        message: message
      })}\n\n`);
    }
  });
}

export default router;
