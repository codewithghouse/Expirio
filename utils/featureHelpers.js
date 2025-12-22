const planFeatures = require('../config/planFeatures');

/**
 * Get feature configuration for a specific plan name.
 * @param {string} planName - The name of the plan (trial, weekly, monthly, lifetime)
 * @returns {object} The features object for that plan
 */
exports.getPlanFeatures = (planName) => {
    // Default to trial if plan name not found or invalid
    return planFeatures[planName] || planFeatures.trial;
};

/**
 * Get all plan features configuration.
 * @returns {object} The entire planFeatures configuration object
 */
exports.getAllPlanFeatures = () => {
    return planFeatures;
};
