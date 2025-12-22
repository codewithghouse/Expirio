const Item = require('../models/Item');
const { calculateDates, determineStatus } = require('../utils/dateHelpers');

exports.getAddItem = (req, res) => {
    res.render('inventory/add', {
        title: 'Add New Item - Expirio',
        user: req.user
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
