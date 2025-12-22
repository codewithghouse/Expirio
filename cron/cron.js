const cron = require('node-cron');
const User = require('../models/User');
const Item = require('../models/Item');
const Alert = require('../models/Alert');
const { determineStatus } = require('../utils/dateHelpers');
const alertService = require('../services/alertService');

const runDailyChecks = async () => {
    console.log('Running daily expiry checks...');
    try {
        const users = await User.find();

        for (const user of users) {
            const items = await Item.find({ owner: user._id });

            for (const item of items) {
                const newStatus = determineStatus(item.expiryDate);
                let alertPayload = null;

                // Check for status change or persisting critical status
                if (item.status !== newStatus) {
                    item.status = newStatus;
                    await item.save();
                }

                // Generate Alerts using Service
                if (newStatus === 'expired') {
                    await alertService.createAlert(
                        user,
                        item,
                        'EXPIRED',
                        `Item "${item.name}" has expired! Please remove it.`
                    );
                } else if (newStatus === 'expiring') {
                    await alertService.createAlert(
                        user,
                        item,
                        'EXPIRING_SOON',
                        `Item "${item.name}" is expiring soon (<= 2 days).`
                    );
                }
            }
        }
        console.log('Daily checks completed.');
    } catch (err) {
        console.error('Error in daily cron:', err);
    }
};

// Schedule: Daily at midnight (0 0 * * *)
// For demo/dev purposes, maybe run every minute? No, user said "Daily (or configurable)".
// I'll set it to run daily, but expose a function to run it elsewhere if needed.
cron.schedule('0 0 * * *', runDailyChecks);

module.exports = { runDailyChecks };
