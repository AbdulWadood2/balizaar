const mongoose = require("mongoose");

const searchAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    categories: [{ type: String }],
    minMaxPrice: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },
    searchWords: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const SearchAlert = mongoose.model("SearchAlert", searchAlertSchema);

module.exports = SearchAlert;
