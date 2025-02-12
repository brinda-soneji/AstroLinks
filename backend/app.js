import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import path from "path"
import cookieParser from "cookie-parser"
import session from "express-session"
import mongoose from "mongoose"
import cors from "cors"
import { fileURLToPath } from "url"
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

import User, { connectDB } from "./models/user.js"

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment variables with fallbacks
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_do_not_use_in_production'
const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
  cors({
    origin: NODE_ENV === 'development' 
      ? "http://localhost:5173"  // Development React app URL
      : "https://your-production-url.com", // Replace with your production URL
    credentials: true,
  })
)
app.use(
  session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
    },
  })
)

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid token" 
    })
  }
}

// Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, role, degree, researchPaper, researchDescription } = req.body;

    console.log('Received registration data:', { ...req.body, password: '[HIDDEN]' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user (password will be hashed in pre-save middleware)
    const userData = {
      username,
      email: email.toLowerCase(),
      password,
      role
    };

    if (role === 'researcher' || role === 'scientist') {
      userData.degree = degree;
      userData.researchPaper = researchPaper;
      userData.researchDescription = researchDescription;
    }

    const user = new User(userData);
    await user.save(); // Password hashing happens here via pre-save middleware

    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error during registration'
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare password using the async comparePassword method
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create user response object
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    };

    res.status(200).json({
      success: true,
      user: userResponse,
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed: " + error.message
    });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("jwt")
  res.json({
    success: true,
    message: "Logged out successfully",
  })
})

app.get("api/profile/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      })
    }

    if (id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      })
    }

    const userResponse = req.user.toObject()
    delete userResponse.password

    res.json({
      success: true,
      user: userResponse,
    })
  } catch (error) {
    console.error("Profile error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    })
  }
})

// MongoDB connection handlers
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err)
})

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected")
})

// Graceful shutdown handler
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close()
    console.log("MongoDB connection closed through app termination")
    process.exit(0)
  } catch (err) {
    console.error("Error during shutdown:", err)
    process.exit(1)
  }
})

// Start server function
const startServer = async () => {
  try {
    await connectDB()

    app.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

// Start the server
startServer()

