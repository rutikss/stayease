const express = require("express");
const router  = express.Router({ mergeParams: true });

const wrapAsync  = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware/loggedIn.js");
const bookingController = require("../controllers/bookingController.js");

// POST /Listings/:id/bookings
router.post("/", isLoggedIn, wrapAsync(bookingController.createBooking));

module.exports = router;
