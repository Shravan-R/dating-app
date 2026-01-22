import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "dating_app.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ SQLite connection failed:", err.message);
  } else {
    console.log("✅ SQLite database connected");
  }
});

db.serialize(() => {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      bio TEXT,
      image_url TEXT,
      hobbies TEXT,
      location TEXT,
      interests TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user INTEGER NOT NULL,
      to_user INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_user, to_user)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1 INTEGER NOT NULL,
      user2 INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user1, user2)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender INTEGER NOT NULL,
      receiver INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add missing columns to existing tables (migrations)
  // Check and add bio column to users table if it doesn't exist
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error("Error checking users table:", err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const hasBio = columnNames.includes('bio');
    const hasCreatedAt = columnNames.includes('created_at');
    const hasUsername = columnNames.includes('username');
    const hasImageUrl = columnNames.includes('image_url');
    const hasHobbies = columnNames.includes('hobbies');
    const hasLocation = columnNames.includes('location');
    const hasInterests = columnNames.includes('interests');
    
    if (!hasBio) {
      db.run("ALTER TABLE users ADD COLUMN bio TEXT", (err) => {
        if (err) {
          console.error("Error adding bio column:", err);
        } else {
          console.log("✅ Added bio column to users table");
        }
      });
    }
    
    if (!hasUsername) {
      db.run("ALTER TABLE users ADD COLUMN username TEXT", (err) => {
        if (err) {
          console.error("Error adding username column:", err);
        } else {
          console.log("✅ Added username column to users table");
        }
      });
    }
    
    if (!hasImageUrl) {
      db.run("ALTER TABLE users ADD COLUMN image_url TEXT", (err) => {
        if (err) {
          console.error("Error adding image_url column:", err);
        } else {
          console.log("✅ Added image_url column to users table");
        }
      });
    }
    
    if (!hasHobbies) {
      db.run("ALTER TABLE users ADD COLUMN hobbies TEXT", (err) => {
        if (err) {
          console.error("Error adding hobbies column:", err);
        } else {
          console.log("✅ Added hobbies column to users table");
        }
      });
    }
    
    if (!hasLocation) {
      db.run("ALTER TABLE users ADD COLUMN location TEXT", (err) => {
        if (err) {
          console.error("Error adding location column:", err);
        } else {
          console.log("✅ Added location column to users table");
        }
      });
    }
    
    if (!hasInterests) {
      db.run("ALTER TABLE users ADD COLUMN interests TEXT", (err) => {
        if (err) {
          console.error("Error adding interests column:", err);
        } else {
          console.log("✅ Added interests column to users table");
        }
      });
    }
    
    if (!hasCreatedAt) {
      // SQLite doesn't support CURRENT_TIMESTAMP as default when adding columns
      // So we add the column first, then update existing rows
      db.run("ALTER TABLE users ADD COLUMN created_at DATETIME", (err) => {
        if (err) {
          console.error("Error adding created_at column:", err);
        } else {
          console.log("✅ Added created_at column to users table");
          // Update existing rows with current timestamp
          db.run("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL", (err2) => {
            if (err2) {
              console.error("Error updating created_at values:", err2);
            }
          });
        }
      });
    }

    // Fix existing users with null or empty names
    db.all("SELECT id, name FROM users WHERE name IS NULL OR name = ''", (err, usersWithNullNames) => {
      if (err) {
        console.error("Error checking for null names:", err);
        return;
      }
      
      if (usersWithNullNames && usersWithNullNames.length > 0) {
        console.log(`⚠️  Found ${usersWithNullNames.length} user(s) with null/empty names. Fixing...`);
        
        usersWithNullNames.forEach((user) => {
          // Set a default name based on user ID
          const defaultName = `User${user.id}`;
          db.run(
            "UPDATE users SET name = ? WHERE id = ?",
            [defaultName, user.id],
            (err) => {
              if (err) {
                console.error(`Error fixing user ${user.id}:`, err);
              } else {
                console.log(`✅ Fixed user ${user.id}: Set name to "${defaultName}"`);
              }
            }
          );
        });
      }
    });
  });

  // Check and add created_at column to likes table if it doesn't exist
  db.all("PRAGMA table_info(likes)", (err, columns) => {
    if (err) {
      // Table might not exist yet, that's okay
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const hasCreatedAt = columnNames.includes('created_at');
    
    if (!hasCreatedAt) {
      db.run("ALTER TABLE likes ADD COLUMN created_at DATETIME", (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error("Error adding created_at to likes:", err);
        } else if (!err) {
          console.log("✅ Added created_at column to likes table");
          // Update existing rows with current timestamp
          db.run("UPDATE likes SET created_at = datetime('now') WHERE created_at IS NULL", (err2) => {
            if (err2) {
              console.error("Error updating likes created_at values:", err2);
            }
          });
        }
      });
    }
  });

  // Check and add created_at column to matches table if it doesn't exist
  db.all("PRAGMA table_info(matches)", (err, columns) => {
    if (err) {
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const hasCreatedAt = columnNames.includes('created_at');
    
    if (!hasCreatedAt) {
      db.run("ALTER TABLE matches ADD COLUMN created_at DATETIME", (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error("Error adding created_at to matches:", err);
        } else if (!err) {
          console.log("✅ Added created_at column to matches table");
          // Update existing rows with current timestamp
          db.run("UPDATE matches SET created_at = datetime('now') WHERE created_at IS NULL", (err2) => {
            if (err2) {
              console.error("Error updating matches created_at values:", err2);
            }
          });
        }
      });
    }
  });
});

export default db;
