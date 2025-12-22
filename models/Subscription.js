const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    paymentId: {
        type: String // For future use
    }
});

// Helper to check if active
subscriptionSchema.methods.isActive = function () {
    if (this.status !== 'active') return false;
    if (!this.endDate) return true; // Lifetime or undefined end
    return this.endDate > new Date();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
