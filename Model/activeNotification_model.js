const mongoose = require("mongoose");

const activeNotificationSchema = new mongoose.Schema(
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

const activeNotification_model = mongoose.model(
  "activeNotification",
  activeNotificationSchema
);

module.exports = activeNotification_model;
