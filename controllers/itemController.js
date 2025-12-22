const Item = require('../models/Item');
const { calculateDates, determineStatus } = require('../utils/dateHelpers');

const suggestions = [
    { name: 'Milk', qty: 1, shelf: 7, icon: '🥛' },
    { name: 'Eggs', qty: 1, shelf: 21, icon: '🥚' },
    { name: 'Bread', qty: 1, shelf: 5, icon: '🍞' },
    { name: 'Bananas', qty: 1, shelf: 4, icon: '🍌' },
    { name: 'Apples', qty: 1, shelf: 14, icon: '🍎' },
    { name: 'Cheese', qty: 1, shelf: 14, icon: '🧀' },
    { name: 'Yogurt', qty: 1, shelf: 10, icon: '🥣' },
    { name: 'Butter', qty: 1, shelf: 30, icon: '🧈' },
    { name: 'Chicken', qty: 1, shelf: 2, icon: '🍗' },
    { name: 'Beef', qty: 1, shelf: 3, icon: '🥩' },
    { name: 'Fish', qty: 1, shelf: 2, icon: '🐟' },
    { name: 'Rice', qty: 1, shelf: 365, icon: '🍚' },
    { name: 'Pasta', qty: 1, shelf: 365, icon: '🍝' },
    { name: 'Potatoes', qty: 1, shelf: 21, icon: '🥔' },
    { name: 'Onions', qty: 1, shelf: 30, icon: '🧅' },
    { name: 'Carrots', qty: 1, shelf: 14, icon: '🥕' },
    { name: 'Tomatoes', qty: 1, shelf: 5, icon: '🍅' },
    { name: 'Cucumber', qty: 1, shelf: 7, icon: '🥒' },
    { name: 'Spinach', qty: 1, shelf: 5, icon: '🍃' },
    { name: 'Lettuce', qty: 1, shelf: 5, icon: '🥬' },
    { name: 'Broccoli', qty: 1, shelf: 5, icon: '🥦' },
    { name: 'Avocado', qty: 1, shelf: 3, icon: '🥑' },
    { name: 'Orange Juice', qty: 1, shelf: 10, icon: '🍊' },
    { name: 'Coffee', qty: 1, shelf: 30, icon: '☕' },
    { name: 'Tea', qty: 1, shelf: 365, icon: '🍵' },
    { name: 'Cereal', qty: 1, shelf: 180, icon: '🥣' },
    { name: 'Oatmeal', qty: 1, shelf: 365, icon: '🌾' },
    { name: 'Sugar', qty: 1, shelf: 365, icon: '🧂' },
    { name: 'Flour', qty: 1, shelf: 180, icon: '🥡' },
    { name: 'Oil', qty: 1, shelf: 365, icon: '🫒' },
    { name: 'Salt', qty: 1, shelf: 365, icon: '🧂' },
    { name: 'Pepper', qty: 1, shelf: 365, icon: '🌶️' },
    { name: 'Garlic', qty: 1, shelf: 60, icon: '🧄' },
    { name: 'Lemon', qty: 1, shelf: 14, icon: '🍋' },
    { name: 'Honey', qty: 1, shelf: 365, icon: '🍯' },
    { name: 'Jam', qty: 1, shelf: 60, icon: '🍓' },
    { name: 'Peanut Butter', qty: 1, shelf: 90, icon: '🥜' },
    { name: 'Chocolate', qty: 1, shelf: 180, icon: '🍫' },
    { name: 'Ice Cream', qty: 1, shelf: 60, icon: '🍦' },
    { name: 'Pizza', qty: 1, shelf: 3, icon: '🍕' },
    { name: 'Soda', qty: 1, shelf: 90, icon: '🥤' },
    { name: 'Water', qty: 1, shelf: 365, icon: '💧' },
    { name: 'Beer', qty: 1, shelf: 90, icon: '🍺' },
    { name: 'Wine', qty: 1, shelf: 365, icon: '🍷' }
];

exports.getAddItem = (req, res) => {
    res.render('inventory/add', {
        title: 'Add New Item - Expirio',
        user: req.user,
        suggestions
    });
};

exports.postAddItem = async (req, res) => {
    try {
        const { name, quantity, shelfLife, daysOld } = req.body;

        // Calculate dates
        const { purchaseDate, expiryDate } = calculateDates(shelfLife, daysOld);
        const status = determineStatus(expiryDate);

        const newItem = new Item({
            name,
            quantity,
            shelfLife,
            purchaseDate,
            expiryDate,
            status,
            owner: req.user._id
        });

        await newItem.save();
        req.flash('success_msg', 'Item added successfully');
        res.redirect('/inventory/fresh'); // Default redirect
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding item');
        res.redirect('/inventory/add');
    }
};

exports.getItems = async (req, res) => {
    try {
        // filter by status from route param or query
        // e.g. /inventory/fresh, /inventory/expiring
        const urlStatus = req.path.split('/')[1]; // catch 'fresh' from '/fresh'

        // Map URL status to DB status if needed, or use directly
        // DB statuses: fresh, expiring, expired
        let filter = { owner: req.user._id };

        if (['fresh', 'expiring', 'expired'].includes(urlStatus)) {
            filter.status = urlStatus;
        }

        const items = await Item.find(filter).sort({ expiryDate: 1 });

        res.render('inventory/list', {
            title: `${urlStatus.charAt(0).toUpperCase() + urlStatus.slice(1)} Items - Expirio`,
            user: req.user,
            items,
            currentStatus: urlStatus
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await Item.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        req.flash('success_msg', 'Item removed');
        res.redirect('back');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error removing item');
        res.redirect('back');
    }
};
