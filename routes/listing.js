const express = require("express");
const router = express.Router({ mergeParams: true });
const crypto = require("crypto");
const timeSafeCompare = require("tsscmp");

const wrapAsync = require("../utils/wrapAsync.js");

const validateSchema = require("../middleware/validation.js");
const { isLoggedIn } = require("../middleware/loggedIn.js");
const isOwner = require("../middleware/isOwner.js");

const { listingSchema, paramsSchema } = require("../schemas/listingSchema.js");

const listingController = require("../controllers/listingController.js");

const upload = require("../middleware/multer.js");
const HttpError = require("../errors/HttpError.js");


// Multer wrapper — converts multer errors into normal Express errors
const handleUpload = (field) => (req, res, next) => {
    upload.single(field)(req, res, (err) => {
        if (err) return next(new HttpError("VALIDATION_ERROR", err.message));
        next();
    });
};

// Manual CSRF check for multipart routes — runs after multer so req.body._csrf is available.
// Uses the same token algorithm as lusca: token = salt(10) + sha1(salt + session_secret).
const verifyCsrf = (req, res, next) => {
    const secretKey = "_csrfSecret";
    const token     = req.body._csrf;
    const secret    = req.session && req.session[secretKey];

    function isValid(tok, sec) {
        if (typeof tok !== "string" || !sec) return false;
        const salt     = tok.slice(0, 10);
        const expected = salt + crypto.createHash("sha1").update(salt + sec).digest("base64");
        return timeSafeCompare(tok, expected);
    }

    if (!isValid(token, secret)) {
        req.flash("error", "Your session expired. Please try again.");
        const referer = req.get("Referer") || "/Listings";
        return res.redirect(referer);
    }
    next();
};


// GET  /Listings        — index
// GET  /Listings/new    — show create form
// POST /Listings        — create new listing (multipart form)

router.get("/", wrapAsync(listingController.index));

router.get("/new", isLoggedIn, wrapAsync(listingController.renderNewForm));

router.post("/",
    isLoggedIn,
    handleUpload("image"),
    verifyCsrf,
    validateSchema(listingSchema, "body"),
    wrapAsync(listingController.createNewListing)
);


// GET    /Listings/:id/edit  — show edit form
// GET    /Listings/:id       — show single listing
// PATCH  /Listings/:id       — update listing
// DELETE /Listings/:id       — delete listing

router.get("/:id/edit",
    isLoggedIn,
    validateSchema(paramsSchema, "params"),
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

router.route("/:id")
    .get(
        validateSchema(paramsSchema, "params"),
        wrapAsync(listingController.showListing)
    )
    .patch(
        isLoggedIn,
        validateSchema(paramsSchema, "params"),
        isOwner,
        handleUpload("editedImage"),
        verifyCsrf,
        validateSchema(listingSchema, "body"),
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        validateSchema(paramsSchema, "params"),
        isOwner,
        wrapAsync(listingController.deleteListing)
    );

module.exports = router;