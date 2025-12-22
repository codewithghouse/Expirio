const Alert = require('../models/Alert');
// const { getPlanFeatures } = require('../utils/featureHelpers'); // Future use

/**
 * Service to handle Alert creation logic
 */
exports.createAlert = async (user, item, type, message) => {
    try {
        // 1. Determine Priority
        let priority = 'info';
        if (type === 'EXPIRED') priority = 'danger';
        if (type === 'EXPIRING_SOON') priority = 'warning';

        // 2. Check for Duplicates (same user, item, type, unread)
        // We only want to avoid spamming the same active alert
        const existingAlert = await Alert.findOne({
            user: user._id,
            item: item ? item._id : null,
            type: type,
            read: false
        });

        if (existingAlert) {
            // Alert already exists and is unread, skip creation
            return null;
        }

        // 3. Create Alert
        const newAlert = await Alert.create({
            user: user._id,
            item: item ? item._id : null,
            type,
            priority,
            message
        });

        return newAlert;

    } catch (err) {
        console.error('Error in alertService.createAlert:', err);
        return null;
    }
};
