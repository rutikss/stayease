const mongoose = require("mongoose");

const AppError = require("../errors/AppError");
const ValidationError = require("../errors/ValidationError");
const HttpError = require("../errors/HttpError");
const DatabaseError = require("../errors/DatabaseError");

module.exports = (err, req, res, next) => {

    res.locals.currUser  = res.locals.currUser  ?? req.user ?? null;
    res.locals.csrfToken = res.locals.csrfToken ?? "";
    res.locals.success   = res.locals.success   ?? [];
    res.locals.error     = res.locals.error     ?? [];

    if (err && (err.message === "CSRF token missing" || err.message === "CSRF token mismatch")) {
        req.flash("error", "Your session expired. Please try again.");
        const referer = req.get("Referer");
        return res.redirect(referer || "/");
    }

    if (err instanceof mongoose.Error.ValidationError) {
        err = new ValidationError(err.message);
    }

    else if (err instanceof mongoose.Error.CastError) {
        err = new HttpError("INVALID_ID", "Invalid ID");
    }

    else if (err.code === 11000) {
        err = new HttpError("DUPLICATE_ENTRY");
    }

    else if (err.name === "MongoServerError") {
        err = new DatabaseError();
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).render("./listings/error.ejs", {
            statusCode: err.statusCode,
            code: err.code,
            message: err.message
        });
    }

    console.error("PROGRAMMING ERROR:", err);

    const internal = new AppError("INTERNAL_SERVER_ERROR");

    return res.status(internal.statusCode).render("./listings/error.ejs", {
        code: internal.code,
        message: internal.message
    });
};