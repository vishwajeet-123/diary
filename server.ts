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

// --- MongoDB Models ---

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    content: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { timestamps: true }
);

diaryEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

const DiaryEntry = mongoose.model("DiaryEntry", diaryEntrySchema);

// --- Express App ---

const app = express();

/* 🔹 Added CORS */
app.use(cors());

app.use(express.json());

// --- Auth Middleware ---

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

    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
    });
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
    let entry = await DiaryEntry.findOne({ userId, date });

    if (entry) {
      return res.status(400).json({
        error: "Entry already exists for this date",
      });
    }

    entry = new DiaryEntry({ userId, date, content, tag });

    await entry.save();

    res.status(201).json({
      id: entry._id,
      message: "Diary entry saved",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save entry" });
  }
});

// --- Vite Integration ---

async function startServer() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not defined");
  } else {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB Atlas");
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

  /* 🔹 Fixed PORT for deployment */
 const PORT: number = Number(process.env.PORT) || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();