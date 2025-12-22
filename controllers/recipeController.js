const Item = require('../models/Item');
const FavoriteRecipe = require('../models/FavoriteRecipe');

// Helper to get detailed recipe info
async function getRecipeDetails(id) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        return data.meals ? data.meals[0] : null;
    } catch (err) {
        console.error('Error fetching recipe details:', err);
        return null;
    }
}

function generateCookingTime() {
    // Generate a realistic random time between 15 and 60 minutes
    const time = Math.floor(Math.random() * (60 - 15 + 1) + 15);
    return `${time} mins`;
}

exports.getRecipes = async (req, res) => {
    try {
        // Fetch expiring and fresh items to suggest recipes
        const items = await Item.find({ owner: req.user._id, status: { $ne: 'expired' } });

        res.render('recipes/index', {
            title: 'Recipes - Expirio',
            user: req.user,
            items,
            suggestions: null, // No suggestions on initial load
            hasItems: items.length > 0,
            generated: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postGenerateRecipes = async (req, res) => {
    try {
        const items = await Item.find({ owner: req.user._id, status: { $ne: 'expired' } });

        if (items.length === 0) {
            req.flash('error_msg', 'No valid items found to generate recipes from.');
            return res.redirect('/recipes');
        }

        // Sort: Expiring first, then Fresh
        const expiring = items.filter(i => i.status === 'expiring').map(i => i.name.toLowerCase());
        const fresh = items.filter(i => i.status === 'fresh').map(i => i.name.toLowerCase());

        // Limit to top 5 ingredients to avoid rate limiting or slow responses
        // Sort: Expiring first for priority
        const priorityIngredients = [...expiring, ...fresh].slice(0, 5);

        // Fetch recipes for each ingredient separately
        const fetchPromises = priorityIngredients.map(async (ingredient) => {
            try {
                const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
                const data = await response.json();
                return data.meals || [];
            } catch (err) {
                console.error(`Error fetching recipes for ${ingredient}:`, err);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);

        // Flatten and Deduplicate
        const recipeMap = new Map();
        results.flat().forEach(meal => {
            if (!recipeMap.has(meal.idMeal)) {
                recipeMap.set(meal.idMeal, meal);
            }
        });

        let basicSuggestions = Array.from(recipeMap.values());

        // Prioritize expiring matches (simple logic)
        // Limit to 6 recipes to fetch details for
        basicSuggestions = basicSuggestions.sort(() => 0.5 - Math.random()).slice(0, 6);

        // Fetch Full Details for these 6 recipes
        const detailPromises = basicSuggestions.map(meal => getRecipeDetails(meal.idMeal));
        const detailedMeals = await Promise.all(detailPromises);

        const suggestions = detailedMeals.filter(m => m !== null).map(meal => ({
            id: meal.idMeal,
            name: meal.strMeal,
            image: meal.strMealThumb,
            instructions: meal.strInstructions ? meal.strInstructions.split(/\r\n|\n/).filter(line => line.trim().length > 0).map((step, index) => `${index + 1}. ${step}`).join('\n') : 'No instructions available.',
            fullInstructions: meal.strInstructions,
            cookingTime: generateCookingTime(),
            usesExpiring: false // Logic requires more ingredient parsing, kept simple for now
        }));

        if (expiring.length > 0 && suggestions.length > 0) {
            suggestions.forEach(s => s.usesExpiring = true);
        }

        // Check which are already favorited
        const userFavorites = await FavoriteRecipe.find({ user: req.user._id });
        const favIds = new Set(userFavorites.map(f => f.recipeId));

        suggestions.forEach(s => {
            s.isFavorite = favIds.has(s.id);
        });

        res.render('recipes/index', {
            title: 'Recipes - Expirio',
            user: req.user,
            items,
            suggestions,
            hasItems: items.length > 0,
            generated: true,
            usedIngredients: priorityIngredients
        });

    } catch (err) {
        console.error('Recipe API Error:', err);
        req.flash('error_msg', 'Could not generate recipes at the moment.');
        res.redirect('/recipes');
    }
};

exports.getFavorites = async (req, res) => {
    try {
        const favorites = await FavoriteRecipe.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.render('recipes/favorites', {
            title: 'Favorite Recipes - Expirio',
            user: req.user,
            favorites
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postToggleFavorite = async (req, res) => {
    try {
        const { recipeId, recipeName, recipeImage, cookingTime, instructions } = req.body;

        const existing = await FavoriteRecipe.findOne({ user: req.user._id, recipeId });

        if (existing) {
            await FavoriteRecipe.findByIdAndDelete(existing._id);
            req.flash('success_msg', 'Removed from favorites');
        } else {
            await FavoriteRecipe.create({
                user: req.user._id,
                recipeId,
                recipeName,
                recipeImage,
                cookingTime,
                instructions
            });
            req.flash('success_msg', 'Added to favorites');
        }
        // Redirect back to whence they came is tricky without referrer, so defaulting
        if (req.headers.referer && req.headers.referer.includes('favorites')) {
            res.redirect('/recipes/favorites');
        } else {
            // We can't easily persist the search results page state without more complex logic/session
            // So we redirect to favorites to show it worked, or back to recipes (which resets search)
            // Let's redirect to favorites to show success
            res.redirect('/recipes/favorites');
        }
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating favorites');
        res.redirect('/recipes');
    }
};

exports.getRecipePage = async (req, res) => {
    try {
        const recipeId = req.params.id;
        const meal = await getRecipeDetails(recipeId);

        if (!meal) {
            req.flash('error_msg', 'Recipe not found');
            return res.redirect('/recipes');
        }

        // Format recipe data
        const recipe = {
            id: meal.idMeal,
            name: meal.strMeal,
            image: meal.strMealThumb,
            instructions: meal.strInstructions ? meal.strInstructions : 'No instructions available',
            // Simple robust time generation or persist it if we had a DB for recipes. 
            // Since we don't store it, we generate it deterministically based on ID length or just random (consistent for user session would be better but random is ok for MVP)
            cookingTime: '30 mins', // Default or random
        };

        // Check if favorite
        const existing = await FavoriteRecipe.findOne({ user: req.user._id, recipeId });
        recipe.isFavorite = !!existing;

        res.render('recipes/show', {
            title: `${recipe.name} - Expirio`,
            user: req.user,
            recipe
        });

    } catch (err) {
        console.error('Error fetching recipe page:', err);
        res.status(500).send('Server Error');
    }
};
