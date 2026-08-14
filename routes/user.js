const express = require("express");
const router = express.Router();

const { rateLimit } = require("express-rate-limit");

const wrapAsync = require("../utils/wrapAsync.js");

const validateSchema = require("../middleware/validation.js");
const { isLoggedIn, saveRedirectUrl } = require("../middleware/loggedIn.js");
const { userSignInSchema, userLogInSchema } = require("../schemas/userSchema.js");
const bookingController = require("../controllers/bookingController.js");

const passport = require("passport");

const userController = require("../controllers/userController.js");


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts, please try again after 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false
});

router.route("/signUp")
    .get(wrapAsync(userController.renderSignUpForm))
    .post(
        validateSchema(userSignInSchema, "body"),
        wrapAsync(userController.createNewAccount)
    );

router.route("/logIn")
    .get(wrapAsync(userController.renderLogInForm))
    .post(
        loginLimiter,
        saveRedirectUrl,
        validateSchema(userLogInSchema, "body"),
        passport.authenticate("local", {
            failureRedirect: "/logIn",
            failureFlash:    "Invalid username or password."
        }),
        wrapAsync(userController.loggingIn)
    );

router.get("/logOut", userController.logOut);

router.get("/bookings",
    isLoggedIn,
    wrapAsync(bookingController.myBookings)
);

router.patch("/bookings/:bookingId/cancel",
    isLoggedIn,
    wrapAsync(bookingController.cancelBooking)
);

module.exports = router;