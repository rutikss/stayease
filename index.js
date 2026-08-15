if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
const app      = require("./app.js");

const port = process.env.PORT || 8080;

async function seedIfEmpty() {
    const Listing  = require("./models/listing.js");
    const User     = require("./models/user.js");
    const initData = require("./init/data.js");

    const count = await Listing.countDocuments();
    if (count > 0) {
        console.log(`DB already has ${count} listings — skipping seed.`);
        return;
    }

    console.log("Empty DB detected — seeding listings...");

    let owner = await User.findOne({});
    if (!owner) {
        owner = new User({ username: "admin", email: "admin@stayease.com" });
        await User.register(owner, "Admin@1234");
        console.log("Seed owner created — username: admin, password: Admin@1234");
    }

    const docs = initData.data.map(obj => ({ ...obj, owner: owner._id }));
    await Listing.insertMany(docs);
    console.log(`Seeded ${docs.length} listings.`);
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
}

mongoose.connection.on("connected", () => {
    console.log("Connected DB:", mongoose.connection.name);
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
});

main()
    .then(async () => {
        console.log("DB connection successful");

        await seedIfEmpty();

        const server = app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });

        function shutdown(signal) {
            console.log(`${signal} received, shutting down`);
            server.close(() => {
                mongoose.connection.close(false, () => {
                    console.log("DB connection closed");
                    process.exit(0);
                });
            });
        }

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT",  () => shutdown("SIGINT"));
    })
    .catch((err) => {
        console.error("DB connection failed:", err.message);
        process.exit(1);
    });