const Listing = require("../models/listing.js");
const Review  = require("../models/review.js");

const findOrFail = require("../utils/findOrFail.js");


async function refreshRating(listingId) {
    const listing = await Listing.findById(listingId)
        .populate({ path: "reviews", select: "rating" });
    if (!listing) return;

    const count = listing.reviews.length;
    const avg   = count > 0
        ? parseFloat(
              (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
          )
        : null;

    await Listing.findByIdAndUpdate(listingId, { avgRating: avg, reviewCount: count });
}


module.exports.createNewReview = async (req, res) => {
    const { id } = req.params;

    await findOrFail(Listing.findById(id));

    const newReview  = new Review(req.body.review);
    newReview.author = req.user._id;
    await newReview.save();

    await Listing.findByIdAndUpdate(id, { $push: { reviews: newReview._id } });

    refreshRating(id).catch(err => console.error("avgRating update failed:", err));

    req.flash("success", "Review posted!");
    res.redirect(`/Listings/${id}`);
};


module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await findOrFail(
        Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    );
    await findOrFail(Review.findByIdAndDelete(reviewId));

    refreshRating(id).catch(err => console.error("avgRating update failed:", err));

    req.flash("success", "Review deleted.");
    res.redirect(`/Listings/${id}`);
};