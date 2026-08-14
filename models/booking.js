const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: true
        },
        guest: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        checkIn: {
            type: Date,
            required: true
        },
        checkOut: {
            type: Date,
            required: true
        },
        guests: {
            type: Number,
            min: 1,
            max: 16,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending"
        }
    },
    { timestamps: true }
);

// Indexes for common query patterns
bookingSchema.index({ guest: 1, createdAt: -1 });                         // My Bookings list
bookingSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });  // availability check

// Ensure checkOut is after checkIn
bookingSchema.pre("validate", function () {
    if (this.checkOut && this.checkIn && this.checkOut <= this.checkIn) {
        this.invalidate("checkOut", "Check-out date must be after check-in date", this.checkOut);
    }
});

module.exports = mongoose.model("Booking", bookingSchema);
