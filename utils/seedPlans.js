const Plan = require('../models/Plan');

const seedPlans = async () => {
    const plans = [
        {
            name: 'trial',
            price: 0,
            durationInDays: 3,
            isLifetime: false,
            description: '3 Days Free Trial'
        },
        {
            name: 'weekly',
            price: 1.99,
            durationInDays: 7,
            isLifetime: false,
            description: 'Weekly Subscription'
        },
        {
            name: 'monthly',
            price: 3.99,
            durationInDays: 30,
            isLifetime: false,
            description: 'Monthly Subscription'
        },
        {
            name: 'lifetime',
            price: 30.00,
            durationInDays: null,
            isLifetime: true,
            description: 'Lifetime Access'
        }
    ];

    try {
        for (const p of plans) {
            // Update if exists, or create if not
            await Plan.findOneAndUpdate(
                { name: p.name },
                p,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`Plan synced: ${p.name}`);
        }
    } catch (err) {
        console.error('Error seeding plans:', err);
    }
};

module.exports = seedPlans;
