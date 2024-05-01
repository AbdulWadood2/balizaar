const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const adminNotification_model = mongoose.model(
  "adminNotification",
  adminNotificationSchema
);

module.exports = adminNotification_model;
