const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['trial', 'weekly', 'monthly', 'lifetime'],
        unique: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    durationInDays: {
        type: Number,
        default: null // null for lifetime
    },
    isLifetime: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        required: true
    },
    features: [String]
});

module.exports = mongoose.model('Plan', planSchema);
