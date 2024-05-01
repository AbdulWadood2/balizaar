const mongoose = require("mongoose");

const adsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Ads = mongoose.model("advertisement", adsSchema);

module.exports = Ads;
