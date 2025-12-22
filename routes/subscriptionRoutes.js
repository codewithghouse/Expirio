const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const subscriptionController = require('../controllers/subscriptionController');

router.get('/', ensureAuthenticated, subscriptionController.getPlans);
router.post('/select', ensureAuthenticated, subscriptionController.postSelectPlan);

module.exports = router;
