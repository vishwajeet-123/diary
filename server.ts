import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("diary.db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    securityQuestion TEXT NOT NULL,
    securityAnswer TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    tag TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

const app = express();
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Signup
app.post("/api/signup", async (req, res) => {
  const { name, email, password, securityQuestion, securityAnswer } = req.body;
  
  // Basic validation
  if (!name || !email || !password || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase(), 10);

  try {
    const stmt = db.prepare("INSERT INTO users (name, email, password, securityQuestion, securityAnswer) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(name, email, hashedPassword, securityQuestion, hashedAnswer);
    res.status(201).json({ message: "User created successfully", userId: info.lastInsertRowid });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed: users.email")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Forgot Password
app.post("/api/forgot-password", async (req, res) => {
  const { email, securityAnswer, newPassword } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !(await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswer))) {
    return res.status(401).json({ error: "Invalid security answer" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);
  res.json({ message: "Password updated successfully" });
});

// Create Diary Entry
app.post("/api/diary", authenticateToken, (req: any, res) => {
  const { date, content, tag } = req.body;
  const userId = req.user.id;

  if (!date || !content || !tag) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const stmt = db.prepare("INSERT INTO diary_entries (userId, date, content, tag) VALUES (?, ?, ?, ?)");
    const info = stmt.run(userId, date, content, tag);
    res.status(201).json({ id: info.lastInsertRowid, message: "Diary entry saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save entry" });
  }
});

// Update Diary Entry
app.put("/api/diary/:id", authenticateToken, (req: any, res) => {
  const { content, tag } = req.body;
  const { id } = req.params;
  const userId = req.user.id;

  const entry: any = db.prepare("SELECT * FROM diary_entries WHERE id = ? AND userId = ?").get(id, userId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  db.prepare("UPDATE diary_entries SET content = ?, tag = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(content, tag, id);
  res.json({ message: "Entry updated successfully" });
});

// Get Entry by Date
app.get("/api/diary/date/:date", authenticateToken, (req: any, res) => {
  const { date } = req.params;
  const userId = req.user.id;
  const entry = db.prepare("SELECT * FROM diary_entries WHERE userId = ? AND date = ?").get(userId, date);
  res.json(entry || null);
});

// Get Entries by Month/Year
app.get("/api/diary/month/:month/:year", authenticateToken, (req: any, res) => {
  const { month, year } = req.params;
  const userId = req.user.id;
  const pattern = `${year}-${month.padStart(2, '0')}-%`;
  const entries = db.prepare("SELECT * FROM diary_entries WHERE userId = ? AND date LIKE ? ORDER BY date DESC").all(userId, pattern);
  res.json(entries);
});

// Get Entries by Tag
app.get("/api/diary/tag/:tag", authenticateToken, (req: any, res) => {
  const { tag } = req.params;
  const userId = req.user.id;
  const entries = db.prepare("SELECT * FROM diary_entries WHERE userId = ? AND tag = ? ORDER BY date DESC").all(userId, tag);
  res.json(entries);
});

// --- Vite Integration ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
