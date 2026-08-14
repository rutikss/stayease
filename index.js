if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
const app = require("./app.js");

const port = process.env.PORT || 8080;

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
    .then(() => {
        console.log("DB connection successful");

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