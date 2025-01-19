const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const flash = require("connect-flash");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require("mongoose");


// Import models
const Admin = require('./models/admin');
const User = require('./models/user');
const Post = require('./models/post');

// Initialize express
const app = express();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(flash());

app.use(
  session({
    secret: "shhh", 
    resave: false,
    saveUninitialized: true,
  })
);
// JWT Secret
const JWT_SECRET = "shhh"; 

app.use((req, res, next) => {
  res.locals.successMessage = req.flash("success");
  res.locals.errorMessage = req.flash("error");
  next();
});

// Middleware to check if user is authenticated
const authenticateUser = async (req, res, next) => {
  try {
    // Check for JWT token in cookies
    const token = req.cookies.jwt; // Changed from token to jwt to match what we set

    if (!token) {
      return res.status(401).redirect("/");
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user with the decoded ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).redirect("/");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).redirect("/");
  }
};

// Root route
app.get("/", (req, res) => {
  res.render("index", { errorMessage: null });
});

// Registration Route
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, degree, researchPaper } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (existingUser) {
      return res.render("index", {
        successMessage: null,
        errorMessage: "Email already registered! Please log in."
      });
    }

    const newUser = new User({
      name,
      email: normalizedEmail,
      password,
      role,
      degree,
      researchPaper
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, { httpOnly: true });

    req.session.successMessage = "Registration successful! Welcome to your profile.";
    return res.redirect(`/profile/${savedUser._id}`);
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.code === 11000) {
      return res.render("index", {
        successMessage: null,
        errorMessage: "Email already registered! Please log in."
      });
    }

    return res.render("index", {
      successMessage: null,
      errorMessage: "An error occurred during registration. Please try again."
    });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (!user) {
      return res.render("index", {
        successMessage: null,
        errorMessage: "User not found! Please create an account."
      });
    }

    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      return res.render("index", {
        successMessage: null,
        errorMessage: "Incorrect password! Please try again."
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, { httpOnly: true });

    req.session.successMessage = "Login successful! Welcome back.";
    return res.redirect(`/profile/${user._id}`);
  } catch (error) {
    console.error("Login error:", error);
    return res.render("index", {
      successMessage: null,
      errorMessage: "An error occurred during login. Please try again."
    });
  }
});

// Profile Route
app.get("/profile/:id", authenticateUser, async (req, res) => {
  try {
    // Get the ID from the URL parameters
    const profileId = req.params.id;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).render("error", {
        errorMessage: "Invalid user ID format"
      });
    }

    // Check if the logged-in user is trying to access their own profile
    if (profileId !== req.user._id.toString()) {
      return res.status(403).render("error", {
        errorMessage: "You can only access your own profile"
      });
    }

    // Get success message from session and clear it
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;

    return res.render("profile", {
      user: req.user,
      successMessage,
      errorMessage: null
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).render("error", {
      errorMessage: "An error occurred while loading the profile"
    });
  }
});

// Add a route for the pending approval page
// app.get('/pending-approval', (req, res) => {
//   res.render('pending-approval', {
//     message: "Your account is pending approval. You'll be notified once an admin reviews your application."
//   });
// });

// Admin approval route
// app.post("/admin/approve/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const user = await User.findById(userId);

//     if (!user || user.role === "enthusiast") {
//       return res.status(400).send("Invalid user or role");
//     }

//     user.isApproved = true;
//     await user.save();
//     res.redirect("/admin/dashboard");
//   } catch (error) {
//     console.error("Error approving user:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// Logout Route
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  req.session.successMessage = "Logged out successfully!";
  res.redirect("/");
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).send("Sorry, page not found!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));