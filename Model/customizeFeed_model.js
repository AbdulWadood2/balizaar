const mongoose = require("mongoose");

const customizeFeedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    categories: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const customizeFeed = mongoose.model("customizeFeed", customizeFeedSchema);

module.exports = customizeFeed;
