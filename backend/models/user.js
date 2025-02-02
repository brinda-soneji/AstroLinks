import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Define the User schema
const userSchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    default: 'images/uploads/default-avatar.png'
  },
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, "Invalid email format"],
    index: true
  },
  password: { 
    type: String, 
    required: [true, "Password is required"] 
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: ["enthusiast", "researcher", "scientist"],
    trim: true
  },
  degree: { type: String, trim: true },
  researchPaper: { type: String, trim: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save middleware to hash the password if modified
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isModified("email")) {
      this.email = this.email.toLowerCase();
    }
    if (this.role === "enthusiast") {
      this.isApproved = true;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password
userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Handle duplicate key errors
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Email already exists"));
  } else {
    next(error);
  }
});

// Create User model
const User = mongoose.model("User", userSchema);

// Database connection function
const connectDB = async () => {
  try {
    const mongoURI = "mongodb://localhost:27017/AstrolinksDB";
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    // Ensure unique index
    await User.collection.createIndex({ email: 1 }, { unique: true });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Export User model and connection function
export default User;
export { connectDB };
