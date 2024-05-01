const mongoose = require('mongoose');

const favouriteProductSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
}, {
    timestamps: true
});

const FavouriteProduct = mongoose.model('favouriteproduct', favouriteProductSchema);

module.exports = FavouriteProduct;