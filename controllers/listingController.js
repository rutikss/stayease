const xss = require("xss");

const findOrFail = require("../utils/findOrFail.js");

const Listing = require("../models/listing.js");

const uploadToCloudinary = require("../utils/cloudinaryUpload.js");

const cloudinary = require("../config/cloudinary.js");


function sanitize(str) {
    return str ? xss(str) : str;
}


module.exports.index = async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip  = (page - 1) * limit;
    const query = (req.query.query || "").trim();

    const filter = query
        ? {
            $or: [
                { title:    { $regex: query, $options: "i" } },
                { location: { $regex: query, $options: "i" } },
                { country:  { $regex: query, $options: "i" } }
            ]
          }
        : {};

    const [allListing, total] = await Promise.all([
        Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Listing.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    const pageTitle = query ? `Search: ${query}` : "Explore Stays";
    res.render("listings/index.ejs", { allListing, page, totalPages, limit, query, total, pageTitle });
};

module.exports.renderNewForm = async (req, res) => {
    res.render("listings/new.ejs", { pageTitle: "Become a Host" });
};

module.exports.createNewListing = async (req, res) => {
    const { title, description, location, country, price } = req.body.listing;

    const listing = new Listing({
        title:       sanitize(title),
        description: sanitize(description),
        location:    sanitize(location),
        country:     sanitize(country),
        price
    });

    listing.owner = req.user._id;

    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        listing.image = {
            url:      result.secure_url,
            filename: result.public_id,
        };
    }
    await listing.save();
    req.flash("success", "Your listing is live!");
    res.redirect("/Listings");
};

module.exports.renderEditForm = async (req, res) => {
    const listing = req.listing;
    res.render("listings/update.ejs", { listing, pageTitle: `Edit: ${listing.title}` });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    const listing = req.listing;

    const { title, description, location, country, price } = req.body.listing;

    if (req.file && listing.image?.filename) {
        await cloudinary.uploader.destroy(listing.image.filename);
    }

    listing.title       = sanitize(title);
    listing.description = sanitize(description);
    listing.location    = sanitize(location);
    listing.country     = sanitize(country);
    listing.price       = price;

    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        listing.image = {
            url:      result.secure_url,
            filename: result.public_id
        };
    }
    await listing.save();
    req.flash("success", "Listing updated.");
    res.redirect(`/Listings/${id}`);
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await findOrFail(Listing.findById(id).populate({
        path: "reviews",
        populate: { path: "author" }
    }).populate("owner"));
    res.render("listings/show.ejs", {
        listing,
        pageTitle: listing.title,
        ogImage:   listing.image?.url || null
    });
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    const listing = req.listing;

    if (listing.image && listing.image.filename !== "default") {
        await cloudinary.uploader.destroy(listing.image.filename);
    }
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted.");
    res.redirect("/Listings");
};