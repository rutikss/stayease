const express = require("express");
const app = express();

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo").MongoStore;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const lusca = require("lusca");

const User = require("./models/user.js");
const HttpError = require("./errors/HttpError.js");
const errorHandler = require("./middleware/errorHandler");

const listingRouter = require("./routes/listing.js");
const reviewRouter  = require("./routes/review.js");
const userRouter    = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");


if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc:  ["'self'"],
                scriptSrc:   ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                imgSrc:      ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
                fontSrc:     ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                connectSrc:  ["'self'"]
            }
        }
    })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.urlencoded({ extended: true }));

const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge:   1000 * 60 * 60 * 24 * 3,
        httpOnly: true,
        sameSite: "lax",
        secure:   process.env.NODE_ENV === "production"
    }
};

if (process.env.NODE_ENV !== "test") {
    sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600
    });
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new LocalStrategy(
        {
            usernameField: "username",
            passwordField: "password",
            badRequestMessage: "Please provide both username and password."
        },
        User.authenticate()
    )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


if (process.env.NODE_ENV !== "test") {
    const csrfMiddleware = lusca.csrf();

    app.use((req, res, next) => {
        const safe   = ["GET", "HEAD", "OPTIONS"];
        const method = req.method.toUpperCase();

        if (safe.includes(method)) return csrfMiddleware(req, res, next);

        const skipPaths = ["/logIn", "/signUp"];
        if (skipPaths.includes(req.path)) return next();
        if (req.path.startsWith("/Listings")) return next();

        return csrfMiddleware(req, res, next);
    });
}

app.use((req, res, next) => {
    res.locals.csrfToken = res.locals._csrf || "";
    next();
});

app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use((req, res, next) => {
    res.locals.success      = req.flash("success");
    res.locals.error        = req.flash("error");
    res.locals.currUser     = req.user;
    res.locals.currentPath  = req.path;
    next();
});

app.use("/Listings/:id/bookings", bookingRouter);
app.use("/Listings/:id/reviews", reviewRouter);
app.use("/Listings", listingRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
    next(new HttpError("RESOURCE_NOT_FOUND"));
});

app.use(errorHandler);


module.exports = app;
