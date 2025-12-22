require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');
require('./config/passport')(passport); // Passport Config
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const seedPlans = require('./utils/seedPlans'); // Import seedPlans

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        await seedPlans(); // Run seedPlans on startup
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Config
app.use(session({
    secret: process.env.SESSION_SECRET || 'expirio_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages
app.use(flash());

// Global Variables Middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Routes
// Mount specific routes first
app.use('/auth', require('./routes/authRoutes'));
app.use('/inventory', require('./routes/itemRoutes'));
app.use('/alerts', require('./routes/alertRoutes'));
app.use('/plans', require('./routes/subscriptionRoutes')); // Mount plans routes
// Mount index routes last (dashboard, recipes)
app.use('/', require('./routes/indexRoutes'));

// Cron Jobs
require('./cron/cron');

// 404 Handler (Optional but good)
app.use((req, res) => {
    res.status(404).render('dashboard', { // Fallback to dashboard or a 404 page
        title: '404 Not Found',
        user: req.user,
        stats: { total: 0, fresh: 0, expiring: 0, expired: 0, unreadAlerts: 0 }, // partial mock
        subscription: null // Fix: Pass null to avoid ReferenceError in view
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
