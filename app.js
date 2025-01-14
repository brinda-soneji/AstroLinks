const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");

// Import models
const Admin = require('./models/admin');
const User = require('./models/user');

// Initialize express
const app = express();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// Set flash messages to locals
app.use((req, res, next) => {
  res.locals.successMessage = req.flash("successMessage");
  res.locals.errorMessage = req.flash("errorMessage");
  next();
});

// Routes
app.get("/", (req, res) => {
  res.redirect("/index");
});

// Render login/register page
app.get("/login", (req, res) => {
  res.render("index");
});

// Handle registration
app.post("/register", async (req, res) => {
  const { name, email, password, role, degree, researchPaper } = req.body;

  if ((role === "researcher" || role === "scientist") && (!degree || !researchPaper)) {
    req.flash("errorMessage", "Degree and research paper are required for this role.");
    return res.redirect("/login");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("errorMessage", "User already exists! Please log in.");
      return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      degree,
      researchPaper,
    });
    await newUser.save();
    req.flash("successMessage", "Registration successful! Please log in.");
    res.redirect("/login");
  } catch (error) {
    console.error("Error during registration:", error);
    req.flash("errorMessage", "An error occurred. Please try again.");
    res.redirect("/login");
  }
});

// Handle login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    const admin = await Admin.findOne({ email });

    if (!user && !admin) {
      req.flash("errorMessage", "Invalid email or password!");
      return res.redirect("/login");
    }

    const validPassword = await bcrypt.compare(
      password,
      user ? user.password : admin.password
    );
    if (!validPassword) {
      req.flash("errorMessage", "Invalid email or password!");
      return res.redirect("/login");
    }

    const token = jwt.sign(
      { id: user ? user._id : admin._id, role: user ? user.role : "admin" },
      "secretKey"
    );
    req.flash("successMessage", "Login successful!");
    res.redirect(`/profile?token=${token}`);
  } catch (error) {
    console.error("Login error:", error);
    req.flash("errorMessage", "An error occurred. Please try again.");
    res.redirect("/login");
  }
});

// Render profile page
app.get("/profile", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send("Access denied");

  try {
    const decoded = jwt.verify(token, "secretKey");
    const user = await User.findById(decoded.id);
    res.render("profile", { user });
  } catch (err) {
    req.flash("errorMessage", "Invalid token. Please log in again.");
    res.redirect("/login");
  }
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).send("Sorry, page not found!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
