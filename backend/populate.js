import db from "./db.js";
import bcrypt from "bcryptjs";

// Fake names, bios, and emails
const firstNames = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
  "Sage", "River", "Skyler", "Phoenix", "Blake", "Cameron", "Dakota", "Emery",
  "Finley", "Harper", "Hayden", "Jaden", "Kai", "Logan", "Mason", "Noah",
  "Olivia", "Sophia", "Emma", "Isabella", "Mia", "Charlotte", "Amelia", "Harper",
  "Evelyn", "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery", "Sofia",
  "Camila", "Aria", "Scarlett", "Victoria", "Madison", "Luna", "Grace", "Chloe",
  "Penelope", "Layla", "Riley", "Zoey", "Nora", "Lily", "Eleanor", "Hannah",
  "Lillian", "Addison", "Aubrey", "Ellie", "Stella", "Natalie", "Zoe", "Leah",
  "Hazel", "Violet", "Aurora", "Savannah", "Audrey", "Brooklyn", "Bella", "Claire",
  "Skylar", "Lucy", "Paisley", "Everly", "Anna", "Caroline", "Nova", "Genesis",
  "Aaliyah", "Kennedy", "Kinsley", "Allison", "Maya", "Sarah", "Madelyn", "Adeline"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
  "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
  "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
  "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
];

const bios = [
  "Love traveling and exploring new places! 🌍",
  "Coffee enthusiast ☕ | Bookworm 📚 | Adventure seeker",
  "Fitness fanatic 💪 | Foodie 🍕 | Always up for a good time",
  "Artist 🎨 | Music lover 🎵 | Looking for someone special",
  "Tech geek 💻 | Gamer 🎮 | Movie buff 🎬",
  "Yoga instructor 🧘 | Nature lover 🌲 | Peace seeker",
  "Chef in training 👨‍🍳 | Wine connoisseur 🍷 | Food explorer",
  "Photographer 📸 | Travel blogger ✈️ | Adventure junkie",
  "Dog mom 🐕 | Fitness enthusiast 💪 | Coffee addict",
  "Musician 🎸 | Songwriter ✍️ | Dreamer",
  "Fashion designer 👗 | Art lover 🖼️ | Creative soul",
  "Engineer 🔧 | Problem solver 💡 | Tech enthusiast",
  "Teacher 📖 | Lifelong learner 🎓 | Passionate educator",
  "Doctor 👨‍⚕️ | Health advocate 💊 | Helping others",
  "Entrepreneur 💼 | Business minded 🚀 | Goal oriented",
  "Yoga instructor 🧘‍♀️ | Meditation guide 🕉️ | Wellness advocate",
  "Chef 👨‍🍳 | Food blogger 📝 | Recipe creator",
  "Photographer 📷 | Nature photographer 🌸 | Art lover",
  "Writer ✍️ | Storyteller 📚 | Creative mind",
  "Fitness trainer 💪 | Health coach 🏋️ | Motivator",
  "Musician 🎹 | Composer 🎼 | Music producer",
  "Designer 🎨 | Creative director 🖌️ | Visual artist",
  "Developer 💻 | Code enthusiast ⌨️ | Tech innovator",
  "Nurse 👩‍⚕️ | Caregiver ❤️ | Compassionate soul",
  "Lawyer ⚖️ | Justice seeker 🏛️ | Advocate",
  "Architect 🏗️ | Builder 🏢 | Design thinker",
  "Scientist 🔬 | Researcher 🧪 | Knowledge seeker",
  "Artist 🎭 | Performer 🎪 | Creative spirit",
  "Athlete 🏃 | Sports enthusiast ⚽ | Team player",
  "Entrepreneur 💡 | Innovator 🚀 | Business builder"
];

const genders = ["Male", "Female", "Other"];

// Generate random email
function generateEmail(firstName, lastName, index) {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`;
}

// Generate random age between 18 and 45
function randomAge() {
  return Math.floor(Math.random() * (45 - 18 + 1)) + 18;
}

// Populate database with fake users
async function populateDatabase() {
  console.log("🚀 Starting to populate database with 100 fake profiles...");
  
  const defaultPassword = await bcrypt.hash("password123", 10);
  let inserted = 0;
  let errors = 0;
  let pending = 0;

  return new Promise((resolve) => {
    for (let i = 0; i < 100; i++) {
      pending++;
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = generateEmail(firstName, lastName, i);
      const age = randomAge();
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const bio = bios[Math.floor(Math.random() * bios.length)];

      const insertUser = (userEmail, attempt = 1) => {
        db.run(
          `INSERT INTO users (name, email, password, age, gender, bio) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [name, userEmail, defaultPassword, age, gender, bio],
          function(err) {
            pending--;
            
            if (err) {
              if (err.message.includes("UNIQUE constraint failed") && attempt < 3) {
                // Email already exists, try with different email
                const altEmail = generateEmail(firstName, lastName, i + 1000 + attempt);
                insertUser(altEmail, attempt + 1);
              } else {
                console.error(`Error inserting user ${i + 1}:`, err.message);
                errors++;
              }
            } else {
              inserted++;
              if (inserted % 10 === 0) {
                console.log(`✅ Inserted ${inserted} profiles...`);
              }
            }

            // Check if all inserts are complete
            if (pending === 0) {
              console.log(`\n✨ Population complete!`);
              console.log(`✅ Successfully inserted: ${inserted} profiles`);
              if (errors > 0) {
                console.log(`⚠️  Errors: ${errors}`);
              }
              console.log(`\n📝 All fake users have password: password123`);
              console.log(`💡 You can login with any email from the generated profiles`);
              resolve();
            }
          }
        );
      };

      insertUser(email);
    }
  });
}

// Simple function to add a few test users
async function addTestUsers() {
  const defaultPassword = await bcrypt.hash("password123", 10);

  const testUsers = [
    { name: "Alice Johnson", email: "alice@example.com", age: 25, gender: "Female" },
    { name: "Bob Smith", email: "bob@example.com", age: 28, gender: "Male" },
    { name: "Charlie Brown", email: "charlie@example.com", age: 22, gender: "Male" },
    { name: "Diana Prince", email: "diana@example.com", age: 26, gender: "Female" },
    { name: "Ethan Hunt", email: "ethan@example.com", age: 30, gender: "Male" }
  ];

  console.log("Adding test users...");

  for (const user of testUsers) {
    db.run(
      `INSERT OR IGNORE INTO users (name, email, password, age, gender, bio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.name, user.email, defaultPassword, user.age, user.gender, `Hi, I'm ${user.name.split(' ')[0]}!`],
      function(err) {
        if (err) {
          console.error(`Error adding ${user.name}:`, err.message);
        } else if (this.changes > 0) {
          console.log(`✅ Added ${user.name}`);
        } else {
          console.log(`⚠️  ${user.name} already exists`);
        }
      }
    );
  }

  // Wait for all inserts to complete
  setTimeout(() => {
    console.log("\nTest users added. You can login with any email using password: password123");
    db.close();
  }, 1000);
}

// Check command line args
const args = process.argv.slice(2);
if (args.includes('--test')) {
  console.log("Adding test users...");
  addTestUsers();
} else {
  // Run population
  populateDatabase()
    .then(() => {
      console.log("\n✅ Database population finished successfully!");
      process.exit(0);
    })
    .catch(err => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
