const wrapAsync = require("../utils/wrapAsync.js");
const findOrFail = require("../utils/findOrFail.js");
const HttpError = require("../errors/HttpError.js");
const Listing = require("../models/listing");

const isOwner = wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const listing = await findOrFail(Listing.findById(id));

    if (!listing.owner.equals(req.user._id)) {
        throw new HttpError("FORBIDDEN");
    }

    req.listing = listing;
    next();
});

module.exports = isOwner;