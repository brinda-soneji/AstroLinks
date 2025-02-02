// Database connection function
import mongoose from "mongoose";

const connectDB = async () => {
    try {
      const mongoURI = "mongodb://localhost:27017/AstrolinksDB";
      await mongoose.connect(mongoURI);
      console.log("Connected to MongoDB");
  
      // Ensure the email index is created
      const User = mongoose.model("User"); // Reference existing model
      await User.collection.createIndex({ email: 1 }, { unique: true });
    } catch (error) {
      console.error("MongoDB connection error:", error.message);
      process.exit(1);
    }
  };

export { connectDB };