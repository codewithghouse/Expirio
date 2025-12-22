const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');

exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({}).sort({ price: 1 });
        // Get current active subscription
        const currentSub = await Subscription.findOne({ user: req.user._id }).populate('plan');

        let currentPlanName = null;
        if (currentSub && currentSub.isActive()) {
            currentPlanName = currentSub.plan.name;
        }

        const { getAllPlanFeatures } = require('../utils/featureHelpers');
        const planFeatures = getAllPlanFeatures();

        res.render('plans', {
            title: 'Pricing Plans - Expirio',
            user: req.user,
            plans,
            currentPlanName,
            planFeatures
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postSelectPlan = async (req, res) => {
    try {
        const planId = req.body.planId;
        const plan = await Plan.findById(planId);

        if (!plan) {
            req.flash('error_msg', 'Invalid Plan Selected');
            return res.redirect('/plans');
        }

        const startDate = new Date();
        let endDate = null;

        if (!plan.isLifetime) {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + plan.durationInDays);
        }

        // Check if subscription exists
        let sub = await Subscription.findOne({ user: req.user._id });

        if (sub) {
            // Update existing
            sub.plan = plan._id;
            sub.startDate = startDate;
            sub.endDate = endDate;
            sub.status = 'active';
            await sub.save();
        } else {
            // Create new
            await Subscription.create({
                user: req.user._id,
                plan: plan._id,
                startDate,
                endDate,
                status: 'active'
            });
        }

        req.flash('success_msg', `Successfully subscribed to ${plan.name} plan!`);
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error selecting plan');
        res.redirect('/plans');
    }
};
