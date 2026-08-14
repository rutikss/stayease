/**
 * Migration: fix-casing.js
 * Converts Listing documents stored in lowercase to proper Title Case.
 * Run once:  node init/fix-casing.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Listing  = require("../models/listing");

function toTitleCase(str) {
    if (!str) return str;
    return str
        .split(" ")
        .map(word =>
            word === word.toUpperCase()
                ? word
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB:", mongoose.connection.db.databaseName);

    const listings = await Listing.find({});
    let updated = 0;

    for (const listing of listings) {
        const titleFixed       = toTitleCase(listing.title);
        const locationFixed    = toTitleCase(listing.location);
        const countryFixed     = toTitleCase(listing.country);
        const descriptionFixed = listing.description
            ? listing.description.charAt(0).toUpperCase() + listing.description.slice(1)
            : listing.description;

        const changed =
            titleFixed       !== listing.title       ||
            locationFixed    !== listing.location    ||
            countryFixed     !== listing.country     ||
            descriptionFixed !== listing.description;

        if (changed) {
            await Listing.findByIdAndUpdate(listing._id, {
                $set: {
                    title:       titleFixed,
                    location:    locationFixed,
                    country:     countryFixed,
                    description: descriptionFixed
                }
            });
            updated++;
            console.log(`  ✔ ${listing._id} — "${listing.title}" → "${titleFixed}"`);
        }
    }

    console.log(`\nDone. Updated ${updated} / ${listings.length} listings.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
