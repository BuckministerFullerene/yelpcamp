if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utilities/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');

const helmet = require('helmet');

// connects to a new db hosted on mongo atlas
// const dbUrl = process.env.DB_URL;

// to prevent mongo injection
const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');

const MongoDBStore = require('connect-mongo')(session);

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

// 'mongodb://localhost:27017/yelp-camp'

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// app.use allows to run code on every single request
app.use(express.urlencoded({ extended: true }));
// to allow browser to send put, patch, delete requests
app.use(methodOverride('_method'));
// tell express to use public folder, name of the folder 'public'
app.use(express.static(path.join(__dirname, 'public')));
// replaces requests that contain '$' or a '.'
app.use(mongoSanitize({
    replaceWith: '_'
}));

const secret = process.env.SECRET || 'thisshouldbeabettersecret';

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    // expire in 24 hours, required in minutes
    touchAfter: 24 * 60 *60,
});

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e)
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // added for basic security
        httpOnly: true,
        // cookies only work in https with secure. localhost is not https
        // secure: true,
        // expires in a week, 1000ms 60sec 60min 24 hours 7 days, can also enter direct number in ms
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
// app.use session should be used before passport.session
app.use(session(sessionConfig));
app.use(flash());
// commented out because of probability of helmet 5.0.1 priotising the more stricter of restrictions
// app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://source.unsplash.com/",
    "https://images.unsplash.com/",
    "https://res.cloudinary.com/drqx53aen/",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css",
    "https://source.unsplash.com/",
    "https://images.unsplash.com/",
    "https://res.cloudinary.com/drqx53aen/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://*.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    "https://source.unsplash.com/",
    "https://images.unsplash.com/",
    "https://res.cloudinary.com/drqx53aen/",
];
const fontSrcUrls = [
    "https://fonts.gstatic.com/",
    "https://source.unsplash.com/",
    "https://images.unsplash.com/",
    "https://res.cloudinary.com/drqx53aen/",
];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/drqx53aen/",
                "https://source.unsplash.com/",
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
            mediaSrc: ["https://res.cloudinary.com/drqx53aen/","https://source.unsplash.com/","https://images.unsplash.com/"],
            childSrc: ["blob:"],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    // console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/fakeUser', async (req, res) => {
    const user = new User ({email:'abc@gmail.com', username:'abcguy'})
    const newUser = await User.register(user,'Chicken');
    res.send(newUser);
})

app.use('/', userRoutes);
app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    next (new ExpressError ('Page Not Found', 404))
});

// added to the end if no request is found
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No! Something went wrong'
    res.status(statusCode).render('error', { err })
});

// app.get('/makeCampground', async (req, res) => {
//     const camp = new campground({title: 'My Backyard', description: 'Cheap camping'});
//     await camp.save();
//     res.send(camp);
// });

app.listen(3000, () => {
    console.log('Serving on port 3000');
});