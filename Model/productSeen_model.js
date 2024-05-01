const mongoose = require("mongoose");
const productSeen = new mongoose.Schema(
  {
    userId: {
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
const data = mongoose.model("productSeen", productSeen);
module.exports = data;
