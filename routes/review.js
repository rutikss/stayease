const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js");

const validateSchema = require("../middleware/validation.js");
const { isLoggedIn } = require("../middleware/loggedIn.js");
const isAuthor = require("../middleware/isReviewAuthor.js");

const { paramsSchema, reviewParamsSchema } = require("../schemas/listingSchema.js");
const reviewSchema = require("../schemas/reviewSchema.js");

const reviewController = require("../controllers/reviewController.js");


router.post("/",
    isLoggedIn,
    validateSchema(paramsSchema, "params"),
    validateSchema(reviewSchema, "body"),
    wrapAsync(reviewController.createNewReview)
);

router.delete("/:reviewId",
    isLoggedIn,
    isAuthor,
    validateSchema(reviewParamsSchema, "params"),
    wrapAsync(reviewController.deleteReview)
);

module.exports = router;