import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const MONGODB_URI = process.env.MONGODB_URI;

// --- MongoDB Models ---

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

const diaryEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  content: { type: String, required: true },
  tag: { type: String, required: true },
}, { timestamps: true });

// Ensure unique entry per user per date
diaryEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

// --- Express App ---

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
  
  if (!name || !email || !password || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase(), 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      securityQuestion,
      securityAnswer: hashedAnswer,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully", userId: user._id });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot Password
app.post("/api/forgot-password", async (req, res) => {
  const { email, securityAnswer, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(securityAnswer.toLowerCase(), user.securityAnswer))) {
      return res.status(401).json({ error: "Invalid security answer" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Diary Entry
app.post("/api/diary", authenticateToken, async (req: any, res) => {
  const { date, content, tag } = req.body;
  const userId = req.user.id;

  if (!date || !content || !tag) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if entry already exists for this date
    let entry = await DiaryEntry.findOne({ userId, date });
    if (entry) {
      return res.status(400).json({ error: "Entry already exists for this date. Use update instead." });
    }

    entry = new DiaryEntry({ userId, date, content, tag });
    await entry.save();
    res.status(201).json({ id: entry._id, message: "Diary entry saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save entry" });
  }
});

// Update Diary Entry
app.put("/api/diary/:id", authenticateToken, async (req: any, res) => {
  const { content, tag } = req.body;
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const entry = await DiaryEntry.findOneAndUpdate(
      { _id: id, userId },
      { content, tag },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// Get Entry by Date
app.get("/api/diary/date/:date", authenticateToken, async (req: any, res) => {
  const { date } = req.params;
  const userId = req.user.id;
  try {
    const entry = await DiaryEntry.findOne({ userId, date });
    res.json(entry || null);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// Get Entries by Month/Year
app.get("/api/diary/month/:month/:year", authenticateToken, async (req: any, res) => {
  const { month, year } = req.params;
  const userId = req.user.id;
  const pattern = new RegExp(`^${year}-${month.padStart(2, '0')}-`);
  try {
    const entries = await DiaryEntry.find({ userId, date: pattern }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// Get Entries by Tag
app.get("/api/diary/tag/:tag", authenticateToken, async (req: any, res) => {
  const { tag } = req.params;
  const userId = req.user.id;
  try {
    const entries = await DiaryEntry.find({ userId, tag }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// --- Vite Integration ---

async function startServer() {
  // Connect to MongoDB
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables.");
  } else {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB Cloud");
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  }

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
