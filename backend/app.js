import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import multer from "multer";
import jwt from "jsonwebtoken";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import mongoose from "mongoose";
import cors from "cors";
import { fileURLToPath } from "url";
import fs from "fs";

import User, { connectDB } from "./models/user.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", // Your React app's URL
  credentials: true
}));
app.use(session({
  secret: "shhh",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Only start the server after successful DB connection
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Add MongoDB connection error handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start the server
startServer();

const JWT_SECRET = "shhh";

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Registration Route
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

// Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

// Verify auth status
app.get("/api/auth/verify", authenticateUser, (req, res) => {
  const userResponse = req.user.toObject();
  delete userResponse.password;
  
  res.json({
    success: true,
    user: userResponse
  });
});

// Logout Route
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("jwt");
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

// Get user profile
app.get("/api/profile/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const userResponse = req.user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));