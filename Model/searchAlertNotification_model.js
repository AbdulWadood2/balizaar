const mongoose = require("mongoose");

const searchAlertNotificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SearchAlertNotification = mongoose.model(
  "SearchAlertNotification",
  searchAlertNotificationSchema
);

module.exports = SearchAlertNotification;
