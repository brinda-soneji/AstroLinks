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
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).redirect("/login");
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user with the decoded ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).redirect("/login");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).redirect("/login");
  }
};

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname))
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

// Initialize multer with our configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Add this to your static middleware setup
app.use('/uploads', express.static('public/uploads'));

// Update your profile update route to handle file uploads
app.post("/update-profile", authenticateUser, upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, role, password } = req.body;

    // Validate input data
    if (!name || !role) {
      req.flash('error', 'Name and role are required');
      return res.redirect(`/profile/${userId}/edit-profile`);
    }

    // Prepare update fields
    const updateFields = {
      name: name.trim(),
      role: role.trim()
    };

    // Add profile picture path if a file was uploaded
    if (req.file) {
      updateFields.profilePicture = '/uploads/' + req.file.filename;
    }

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateFields.password = await bcrypt.hash(password.trim(), 10);
    }

    // Update the user using findOneAndUpdate
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateFields },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      req.flash('error', 'User not found');
      return res.redirect('/profile');
    }

    // Set success message and redirect
    req.flash('success', 'Profile updated successfully');
    return res.redirect(`/profile/${userId}`);

  } catch (error) {
    console.error("Error updating profile:", error);
    req.flash('error', error.message || 'Error updating profile');
    return res.redirect(`/profile/${req.user._id}/edit-profile`);
  }
});

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

app.get("/profile/:id/edit-profile", authenticateUser, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).redirect("/profile");
    }
    res.render("edit-profile", { user: req.user });
  } catch (error) {
    console.error("Error loading edit profile page:", error);
    res.status(500).send("Server error");
  }
});
// Update user information
app.post("/update-profile", authenticateUser, async (req, res) => {
  try {
    // Get the user ID from the authenticated user
    const userId = req.user._id;

    const { name, role, password } = req.body;

    // Validate input data
    if (!name || !role) {
      req.flash('error', 'Name and role are required');
      return res.redirect(`/profile/${userId}/edit-profile`);
    }

    // Validate role values
    const allowedRoles = ['enthusiast', 'researcher', 'scientist'];
    if (!allowedRoles.includes(role)) {
      req.flash('error', 'Invalid role selected');
      return res.redirect(`/profile/${userId}/edit-profile`);
    }

    // Prepare update fields
    const updateFields = {
      name: name.trim(),
      role: role.trim()
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateFields.password = await bcrypt.hash(password.trim(), 10);
    }

    // Update the user using findOneAndUpdate
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateFields },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      req.flash('error', 'User not found');
      return res.redirect('/profile');
    }

    // Set success message and redirect
    req.flash('success', 'Profile updated successfully');
    return res.redirect(`/profile/${userId}`);

  } catch (error) {
    console.error("Error updating profile:", error);
    req.flash('error', 'Error updating profile');
    return res.redirect(`/profile/${req.user._id}/edit-profile`);
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