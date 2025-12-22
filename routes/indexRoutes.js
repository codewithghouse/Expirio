const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const recipeController = require('../controllers/recipeController');
const { ensureAuthenticated } = require('../middlewares/auth');

router.use(ensureAuthenticated);

router.get('/dashboard', dashboardController.getDashboard);
router.get('/recipes/favorites', recipeController.getFavorites);
router.post('/recipes/favorite', recipeController.postToggleFavorite);
router.get('/recipes', recipeController.getRecipes);
router.post('/recipes/generate', recipeController.postGenerateRecipes);
router.get('/recipes/:id', recipeController.getRecipePage);
router.get('/profile', require('../controllers/authController').getProfile);

// Redirect root to dashboard (already handled in app.js but safety)
router.get('/', (req, res) => res.redirect('/dashboard'));

module.exports = router;
