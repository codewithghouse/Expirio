const mongoose = require('mongoose');

const favoriteRecipeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipeId: {
        type: String,
        required: true
    },
    recipeName: {
        type: String,
        required: true
    },
    recipeImage: {
        type: String
    },
    cookingTime: {
        type: String
    },
    instructions: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FavoriteRecipe', favoriteRecipeSchema);
