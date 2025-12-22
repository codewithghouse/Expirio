/**
 * Feature Configuration per Plan
 * This file defines the access limits and capabilities for each plan type.
 * It is used for display and server-side validation (future).
 */

const planFeatures = {
    trial: {
        maxItems: 50,
        maxAlerts: 5,
        automationEnabled: false,
        recipeSuggestions: false,
        barcodeScanner: false,
        priorityAlerts: false,
        description: 'Basic access to test the platform.'
    },
    weekly: {
        maxItems: 100,
        maxAlerts: 20,
        automationEnabled: true,
        recipeSuggestions: true,
        barcodeScanner: true,
        priorityAlerts: false,
        description: 'Great for short-term planning.'
    },
    monthly: {
        maxItems: 500,
        maxAlerts: 50,
        automationEnabled: true,
        recipeSuggestions: true,
        barcodeScanner: true,
        priorityAlerts: true,
        description: 'Perfect for regular home management.'
    },
    lifetime: {
        maxItems: Infinity,
        maxAlerts: Infinity,
        automationEnabled: true,
        recipeSuggestions: true,
        barcodeScanner: true,
        priorityAlerts: true,
        description: 'Unlimited access forever.'
    }
};

module.exports = planFeatures;
