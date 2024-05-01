const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  sallerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500,
  },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
