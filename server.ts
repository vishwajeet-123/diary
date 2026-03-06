import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing");
  process.exit(1);
}

const app = express();

/* ---------------- Middleware ---------------- */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/* ---------------- MongoDB Models ---------------- */

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    securityQuestion: String,
    securityAnswer: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    date: String,
    content: String,
    tag: String,
  },
  { timestamps: true }
);

diaryEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

/* ---------------- Auth Middleware ---------------- */

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {

    if (err) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = user;
    next();
  });
};

/* ---------------- AUTH ROUTES ---------------- */

app.post("/api/signup", async (req, res) => {

  const { name, email, password, securityQuestion, securityAnswer } = req.body;

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

    res.status(201).json({ message: "User created successfully" });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/login", async (req, res) => {

  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {

    res.status(500).json({ error: "Internal server error" });
  }
});


/* ---------------- DIARY ROUTES ---------------- */

/* Create Entry */

app.post("/api/diary", authenticateToken, async (req, res) => {

  const { date, content, tag } = req.body;
  const userId = req.user.id;

  try {

    let entry = await DiaryEntry.findOne({ userId, date });

    if (entry) {
      return res.status(400).json({
        error: "Entry already exists for this date",
      });
    }

    entry = new DiaryEntry({
      userId,
      date,
      content,
      tag,
    });

    await entry.save();

    res.status(201).json({
      id: entry._id,
      message: "Diary entry saved",
    });

  } catch (err) {

    res.status(500).json({ error: "Failed to save entry" });
  }
});


/* Get Entry by Date */

app.get("/api/diary/date/:date", authenticateToken, async (req, res) => {

  const { date } = req.params;
  const userId = req.user.id;

  try {

    const entry = await DiaryEntry.findOne({ userId, date });

    res.json(entry || null);

  } catch (err) {

    res.status(500).json({ error: "Failed to fetch entry" });
  }
});


/* Update Entry */

app.put("/api/diary/:id", authenticateToken, async (req, res) => {

  const { id } = req.params;
  const { content, tag } = req.body;
  const userId = req.user.id;

  try {

    const entry = await DiaryEntry.findOneAndUpdate(
      { _id: id, userId },
      { content, tag },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({
      message: "Entry updated successfully",
    });

  } catch (err) {

    res.status(500).json({ error: "Failed to update entry" });
  }
});


/* ---------------- SERVER START ---------------- */

async function startServer() {

  try {

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

  } catch (err) {

    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }

  if (process.env.NODE_ENV !== "production") {

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);

  } else {

    app.use(express.static(path.join(__dirname, "dist")));

    app.get("*", (req, res, next) => {

      if (req.path.startsWith("/api")) {
        return next();
      }

      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();