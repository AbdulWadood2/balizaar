const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    productImage: [{ type: String, required: true }],
    productName: { type: String, required: true },
    listingType: { type: String, required: true, enum: [0, 1] }, // 0 for sell, 1 for free
    productStatus: { type: String, enum: [0, 1, 2], default: 0 }, // 0 for active, 1 for reserved, 2 for sold
    productPrice: { type: Number, required: true },
    openToOffers: { type: Boolean, default: false },
    productDescription: { type: String, required: true },
    category: [{ type: String, required: true }],
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("product", productSchema);
module.exports = data;
