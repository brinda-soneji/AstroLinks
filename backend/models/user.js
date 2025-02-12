import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the User schema
const userSchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    default: 'images/uploads/default-avatar.png'
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, "Invalid email format"],
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['enthusiast', 'researcher', 'scientist'],
    default: 'enthusiast'
  },
  degree: {
    type: String,
    required: function() {
      return this.role === 'researcher' || this.role === 'scientist';
    }
  },
  researchPaper: {
    type: String,
    required: function() {
      return this.role === 'researcher' || this.role === 'scientist';
    }
  },
  researchDescription: {
    type: String,
    required: function() {
      return this.role === 'researcher' || this.role === 'scientist';
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  try {
    // Only hash the password if it's new or modified
    if (!this.isModified('password')) {
      return next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;

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

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Use bcrypt to compare the candidate password with stored hash
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw error;
  }
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
