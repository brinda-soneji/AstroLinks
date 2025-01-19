const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // References the User schema
    required: true,
  },
  role: {
    type: String,
    enum: ["enthusiast", "researcher", "scientist"], // Matches user roles
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  attachments: [
    {
      fileName: { type: String },
      filePath: { type: String },
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);
