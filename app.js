const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");

const Admin = require('./backend/models/admin');
const User = require('./backend/models/user');
const Post = require('./backend/models/posts');

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/loginSystem", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const admin = await Admin.findOne({ email });

  if (!user && !admin) {
    return res.status(400).json({ message: "Invalid email or password!" });
  }

  const validPassword = await bcrypt.compare(
    password,
    user ? user.password : admin.password
  );
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid email or password!" });
  }

  const token = jwt.sign(
    { id: user ? user._id : admin._id, role: user ? user.role : "admin" },
    "secretKey"
  );

  // Redirect to profile page
  res.redirect(`/profile?token=${token}`);
});

app.get("/profile", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send("Access denied");

  try {
    const decoded = jwt.verify(token, "secretKey");
    const user = await User.findById(decoded.id);
    res.render("profile", { user });
  } catch (err) {
    res.status(400).send("Invalid token");
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
