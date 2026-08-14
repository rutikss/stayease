const Listing  = require("../models/listing.js");
const Booking  = require("../models/booking.js");
const findOrFail = require("../utils/findOrFail.js");
const HttpError  = require("../errors/HttpError.js");

module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const listing = await findOrFail(Listing.findById(id));

    const { checkIn, checkOut, guests } = req.body.booking;

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
        throw new HttpError("VALIDATION_ERROR", "Check-out must be after check-in.");
    }

    const conflict = await Booking.findOne({
        listing:  listing._id,
        status:   { $ne: "cancelled" },
        checkIn:  { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
    });

    if (conflict) {
        req.flash("error", "Those dates are already booked. Please choose different dates.");
        return res.redirect(`/Listings/${id}`);
    }

    const nights     = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.price;

    await Booking.create({
        listing:    listing._id,
        guest:      req.user._id,
        checkIn:    checkInDate,
        checkOut:   checkOutDate,
        guests:     Number(guests),
        totalPrice
    });

    req.flash("success", `Booking confirmed! ${nights} night${nights > 1 ? "s" : ""} · ₹${totalPrice.toLocaleString("en-IN")} total`);
    res.redirect(`/Listings/${id}`);
};

module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    res.render("bookings/index.ejs", { bookings, pageTitle: "My Bookings" });
};

module.exports.cancelBooking = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await findOrFail(Booking.findById(bookingId));

    if (!booking.guest.equals(req.user._id)) {
        throw new HttpError("FORBIDDEN", "You are not authorised to cancel this booking.");
    }

    if (booking.status === "cancelled") {
        req.flash("error", "This booking is already cancelled.");
        return res.redirect("/bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled.");
    res.redirect("/bookings");
};
