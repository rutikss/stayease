const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");

// Must be set before app.js is loaded so MongoStore + lusca are disabled in test env
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret-key";

require("dotenv").config();

let mongod;
let app;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();

    app = require("../app");

    await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
});


describe("Health check", () => {
    it("GET /health returns 200", async () => {
        const res = await request(app).get("/health");
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});


describe("404 handling", () => {
    it("unknown route returns 404", async () => {
        const res = await request(app).get("/does-not-exist");
        expect(res.statusCode).toBe(404);
    });
});


describe("Auth routes", () => {
    it("GET /signUp returns 200", async () => {
        const res = await request(app).get("/signUp");
        expect(res.statusCode).toBe(200);
    });

    it("GET /logIn returns 200", async () => {
        const res = await request(app).get("/logIn");
        expect(res.statusCode).toBe(200);
    });

    it("POST /logIn with empty body redirects (passport rejects credentials)", async () => {
        const res = await request(app).post("/logIn").send({});
        // Passport fails auth and redirects back to /logIn — not a 400 schema error
        expect(res.statusCode).toBe(302);
    });

    it("POST /signUp with invalid email returns 400", async () => {
        const res = await request(app)
            .post("/signUp")
            .type("form")
            .send({
                "user[username]": "testuser",
                "user[email]": "notanemail",
                "user[password]": "pass123"
            });
        expect(res.statusCode).toBe(400);
    });

    it("POST /signUp with password < 6 chars returns 400", async () => {
        const res = await request(app)
            .post("/signUp")
            .type("form")
            .send({
                "user[username]": "testuser",
                "user[email]": "test@example.com",
                "user[password]": "abc"
            });
        expect(res.statusCode).toBe(400);
    });
});


describe("Listing param validation", () => {
    it("GET /Listings/invalid-id returns 400", async () => {
        const res = await request(app).get("/Listings/notanid");
        expect(res.statusCode).toBe(400);
    });

    it("GET /Listings/000000000000000000000000 (valid id, no doc) returns 404", async () => {
        const res = await request(app).get("/Listings/000000000000000000000000");
        expect(res.statusCode).toBe(404);
    });
});


describe("Rate limiting on login", () => {
    it("more than 10 login attempts returns 429", async () => {
        const attempts = Array(12).fill(null).map(() =>
            request(app)
                .post("/logIn")
                .type("form")
                .send({ "user[username]": "fakeuser", "user[password]": "fakepass" })
        );
        const results = await Promise.all(attempts);
        const statuses = results.map(r => r.statusCode);
        expect(statuses).toContain(429);
    });
});
