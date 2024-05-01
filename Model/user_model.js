const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: null },
    bio: { type: String, default: null },
    userImage: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    refreshToken: [{ type: String }],
    location: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON type
      },
      coordinates: {
        type: [Number], // Array of numbers for longitude and latitude
        required: true,
      },
    },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    fcm_key: [{ type: String }],
    otp: { type: String, default: null },
    socketId: [{ type: String, default: null }],
    notification: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Define the 2dsphere index
userSchema.index({ location: "2dsphere" });

const User = mongoose.model("user", userSchema);
module.exports = User;
