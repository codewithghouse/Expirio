module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/auth/login');
    },

    ensureRole: function (role) {
        return function (req, res, next) {
            if (req.isAuthenticated() && req.user.role === role) {
                return next();
            }
            if (req.isAuthenticated()) {
                req.flash('error_msg', 'You are not authorized to view that resource');
                return res.redirect('/dashboard');
            }
            req.flash('error_msg', 'Please log in to view that resource');
            res.redirect('/auth/login');
        }
    }
};
