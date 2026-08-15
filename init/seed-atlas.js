/**
 * init/seed-atlas.js
 * Run this on Render via the Shell tab to seed the Atlas database.
 * Usage: node init/seed-atlas.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Listing  = require("../models/listing.js");
const User     = require("../models/user.js");
const initData = require("./data.js");

async function main() {
    console.log("Connecting to:", process.env.MONGO_URI?.replace(/:([^@]+)@/, ":***@"));
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB:", mongoose.connection.db.databaseName);

    let owner = await User.findOne({});
    if (!owner) {
        console.log("No users found — creating a seed owner account...");
        owner = new User({ username: "admin", email: "admin@stayease.com" });
        await User.register(owner, "Admin@1234");
        console.log("Seed owner created: username=admin password=Admin@1234");
        console.log("CHANGE THIS PASSWORD after first login!");
    }

    console.log(`Using owner: ${owner.username} (${owner._id})`);

    await Listing.deleteMany({});
    console.log("Cleared existing listings.");

    const docs = initData.data.map(obj => ({ ...obj, owner: owner._id }));
    await Listing.insertMany(docs);

    console.log(`✅ Seeded ${docs.length} listings into Atlas.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
