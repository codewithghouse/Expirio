const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('item');
        res.render('alerts/index', {
            title: 'Alerts - Expirio',
            user: req.user,
            alerts
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Alert.findByIdAndUpdate(req.params.id, { read: true });
        res.redirect('/alerts');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.markAllReader = async (req, res) => {
    try {
        await Alert.updateMany({ user: req.user._id, read: false }, { read: true });
        req.flash('success_msg', 'All alerts marked as read');
        res.redirect('/alerts');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error marking alerts');
        res.redirect('/alerts');
    }
};
