require("dotenv").config();
const mongoose = require("mongoose");
const Listing  = require("../models/listing.js");
const User     = require("../models/user.js");
const initData = require("./data.js");

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB:", mongoose.connection.db.databaseName);

    let owner = await User.findOne({});
    if (!owner) {
        throw new Error("No users found. Please sign up first, then run this seeder.");
    }

    console.log(`Using owner: ${owner.username} (${owner._id})`);

    await Listing.deleteMany({});

    const docs = initData.data.map(obj => ({ ...obj, owner: owner._id }));
    await Listing.insertMany(docs);

    console.log(`Seeded ${docs.length} listings.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});