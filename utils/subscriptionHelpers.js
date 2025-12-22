const Subscription = require('../models/Subscription');

// Internal helper for date diff
const getDaysLeft = (sub) => {
    if (!sub.endDate) return Infinity; // Lifetime
    const now = new Date();
    const end = new Date(sub.endDate);
    const diff = end - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getSubscriptionStatus = async (user) => {
    if (!user) return { isActive: false, status: 'no_user' };

    const sub = await Subscription.findOne({ user: user._id }).populate('plan');

    if (!sub) {
        return { isActive: false, status: 'no_sub', plan: null };
    }

    const isActive = sub.isActive();

    // Auto-update status to expired if date passed but status says active
    if (sub.status === 'active' && !isActive) {
        sub.status = 'expired';
        await sub.save();
    }

    return {
        isActive,
        status: sub.status,
        plan: sub.plan,
        daysLeft: getDaysLeft(sub),
        isTrial: sub.plan.name === 'trial'
    };
};

const isSubscriptionActive = async (user) => {
    const status = await getSubscriptionStatus(user);
    return status.isActive;
};

const isTrial = async (user) => {
    const status = await getSubscriptionStatus(user);
    return status.isTrial === true;
};

module.exports = {
    getSubscriptionStatus,
    isSubscriptionActive,
    isTrial,
    // Alias for backward compatibility if I don't want to change dashboardController yet,
    // but I WILL change dashboardController to be clean.
    checkSubscriptionStatus: getSubscriptionStatus
};
