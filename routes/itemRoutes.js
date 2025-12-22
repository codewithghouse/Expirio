const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.use(ensureAuthenticated);

router.get('/add', itemController.getAddItem);
router.post('/add', itemController.postAddItem);
router.post('/add-batch', itemController.postAddBatch);

router.get('/fresh', itemController.getItems);
router.get('/expiring', itemController.getItems);
router.get('/expired', itemController.getItems);

router.delete('/:id', itemController.deleteItem);

module.exports = router;
