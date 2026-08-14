const User = require("../models/user.js");


module.exports.renderSignUpForm = async (req, res) => {
    res.render("./users/signUp.ejs", { pageTitle: "Create Account" });
};

module.exports.createNewAccount = async (req, res, next) => {
    try {
        const { username, email, password } = req.body.user;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to StayEase!");
            res.redirect("/Listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signUp");
    }
};

module.exports.renderLogInForm = async (req, res) => {
    res.render("./users/logIn.ejs", { pageTitle: "Sign In" });
};

module.exports.loggingIn = async (req, res) => {
    req.flash("success", "Welcome back to StayEase!");
    res.redirect(res.locals.redirectUrl || "/Listings");
};

module.exports.logOut = (req, res, next) => {
    req.logOut((error) => {
        if (error) return next(error);
        req.flash("success", "Logged out successfully.");
        res.redirect("/Listings");
    });
};