const mongoose = require("mongoose");

const questionareSchema = new mongoose.Schema(
  {
    // Define your schema fields here
    question: {
      type: String,
      required: true,
      unique: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["faqs", "category"],
    },
  },
  {
    timestamps: true,
  }
);

const Questionare = mongoose.model("Questionare", questionareSchema);

module.exports = Questionare;
