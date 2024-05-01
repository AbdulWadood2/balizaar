const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema(
  {
    privacy_policy: { type: String, default: null },
    terms_and_conditions: { type: String, default: null },
    about_us: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);
const data = mongoose.model("admindocument", adminSchema);
module.exports = data;
