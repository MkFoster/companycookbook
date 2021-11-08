const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const recipeSchema = new mongoose.Schema({
    url: {
        type: String
    },
    title: {
        type: String
    },
    siteName: {
        type: String
    },
    description: {
        type: String
    },
    coverImage: {
        type: String
    }
});

module.exports = mongoose.model('Recipe', recipeSchema);