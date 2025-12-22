const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.use(ensureAuthenticated);

router.get('/', alertController.getAlerts);
router.post('/:id/read', alertController.markAsRead);
router.post('/read-all', alertController.markAllReader);

module.exports = router;
