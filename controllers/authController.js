const passport = require('passport');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');

exports.getLogin = (req, res) => {
    res.render('auth/login', { title: 'Login - Expirio' });
};

exports.postLogin = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/auth/login',
        failureFlash: true
    })(req, res, next);
};

exports.getRegister = (req, res) => {
    res.render('auth/register', { title: 'Register - Expirio' });
};

exports.postRegister = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    const errors = [];

    if (!name || !email || !password || !confirmPassword) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.render('auth/register', {
            errors,
            name,
            email,
            password,
            confirmPassword,
            title: 'Register - Expirio'
        });
    }

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            errors.push({ msg: 'Email already exists' });
            return res.render('auth/register', {
                errors,
                name,
                email,
                password,
                confirmPassword,
                title: 'Register - Expirio'
            });
        }

        const newUser = new User({
            name,
            email,
            password
        });

        await newUser.save();

        // Assign Free Trial
        const trialPlan = await Plan.findOne({ name: 'trial' });
        if (trialPlan) {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 3);

            await Subscription.create({
                user: newUser._id,
                plan: trialPlan._id,
                startDate,
                endDate,
                status: 'active'
            });
        }

        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
};
