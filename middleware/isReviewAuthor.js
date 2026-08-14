const wrapAsync = require("../utils/wrapAsync.js");
const findOrFail = require("../utils/findOrFail.js");
const HttpError = require("../errors/HttpError.js");
const Review = require("../models/review.js");

const isAuthor = wrapAsync(async (req, res, next) => {
    const { reviewId } = req.params;
    const review = await findOrFail(Review.findById(reviewId));

    if (!review.author.equals(req.user._id)) {
        throw new HttpError("FORBIDDEN");
    }

    next();
});

module.exports = isAuthor;