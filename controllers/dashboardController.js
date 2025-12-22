const Item = require('../models/Item');
const Alert = require('../models/Alert');
const { checkSubscriptionStatus } = require('../utils/subscriptionHelpers');

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        const totalItems = await Item.countDocuments({ owner: userId });
        const freshItems = await Item.countDocuments({ owner: userId, status: 'fresh' });
        const expiringItems = await Item.countDocuments({ owner: userId, status: 'expiring' });
        const expiredItems = await Item.countDocuments({ owner: userId, status: 'expired' });

        // Check for unread alerts for the badge or generic checking
        const unreadAlerts = await Alert.countDocuments({ user: userId, read: false });

        // Get Subscription Status
        const subStatus = await checkSubscriptionStatus(req.user);

        res.render('dashboard', {
            title: 'Dashboard - Expirio',
            user: req.user,
            stats: {
                total: totalItems,
                fresh: freshItems,
                expiring: expiringItems,
                expired: expiredItems,
                unreadAlerts
            },
            subscription: subStatus
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
