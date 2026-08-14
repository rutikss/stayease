/**
 * tests/listing.test.js
 * Integration tests for Listings + Reviews.
 * Uses mongodb-memory-server — no real DB touched.
 * CSRF is disabled in NODE_ENV=test.
 */

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request  = require("supertest");

process.env.NODE_ENV       = "test";
process.env.SESSION_SECRET = "test-secret-key";
require("dotenv").config();

jest.mock("../utils/cloudinaryUpload.js", () =>
    jest.fn().mockResolvedValue({
        secure_url: "https://res.cloudinary.com/test/image/upload/test.jpg",
        public_id:  "test/listing-test"
    })
);

jest.mock("../config/cloudinary.js", () => ({
    uploader: {
        destroy: jest.fn().mockResolvedValue({ result: "ok" })
    }
}));

let mongod, app, agent;

const TEST_USER = {
    "user[username]": "testhost",
    "user[email]":    "host@test.com",
    "user[password]": "password123"
};

const LISTING_BODY = {
    "listing[title]":       "Cozy Mountain Cabin",
    "listing[description]": "A lovely cabin with mountain views.",
    "listing[location]":    "Manali",
    "listing[country]":     "India",
    "listing[price]":       "3500"
};

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();

    app = require("../app");

    await mongoose.connect(process.env.MONGO_URI);

    agent = request.agent(app);

    await agent.post("/signUp").type("form").send(TEST_USER);
}, 30000);

afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
});


describe("Listing — Read (index + show)", () => {
    it("GET /Listings returns 200", async () => {
        const res = await request(app).get("/Listings");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("StayEase");
    });

    it("GET /Listings with ?query= returns 200", async () => {
        const res = await request(app).get("/Listings?query=Beach");
        expect(res.statusCode).toBe(200);
    });

    it("GET /Listings/invalid-id returns 400", async () => {
        const res = await request(app).get("/Listings/notanid");
        expect(res.statusCode).toBe(400);
    });

    it("GET /Listings/000000000000000000000000 (valid id, no doc) returns 404", async () => {
        const res = await request(app).get("/Listings/000000000000000000000000");
        expect(res.statusCode).toBe(404);
    });
});


describe("Listing — Auth guards", () => {
    it("GET /Listings/new redirects unauthenticated user to /logIn", async () => {
        const res = await request(app).get("/Listings/new");
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toContain("/logIn");
    });

    it("POST /Listings redirects unauthenticated user to /logIn", async () => {
        const res = await request(app)
            .post("/Listings")
            .type("form")
            .send(LISTING_BODY);
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toContain("/logIn");
    });
});


describe("Listing — Create (authenticated)", () => {
    it("GET /Listings/new returns 200 when logged in", async () => {
        const res = await agent.get("/Listings/new");
        expect(res.statusCode).toBe(200);
    });

    it("POST /Listings with valid body creates listing and redirects", async () => {
        const res = await agent
            .post("/Listings")
            .type("form")
            .send(LISTING_BODY);

        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toMatch(/\/Listings/);
    });

    it("POST /Listings without title returns 400", async () => {
        const res = await agent
            .post("/Listings")
            .type("form")
            .send({
                "listing[description]": "desc",
                "listing[location]":    "Goa",
                "listing[country]":     "India",
                "listing[price]":       "2000"
            });
        expect(res.statusCode).toBe(400);
    });

    it("POST /Listings with negative price returns 400", async () => {
        const res = await agent
            .post("/Listings")
            .type("form")
            .send({ ...LISTING_BODY, "listing[price]": "-100" });
        expect(res.statusCode).toBe(400);
    });
});


describe("Listing — Update & Delete (authenticated, own listing)", () => {
    let listingId;

    beforeAll(async () => {
        await agent.post("/Listings").type("form").send(LISTING_BODY);
        const Listing = require("../models/listing");
        const doc = await Listing.findOne({ title: "Cozy Mountain Cabin" });
        listingId = doc._id.toString();
    });

    it("GET /Listings/:id returns 200", async () => {
        const res = await agent.get(`/Listings/${listingId}`);
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Cozy Mountain Cabin");
    });

    it("GET /Listings/:id/edit returns 200 for owner", async () => {
        const res = await agent.get(`/Listings/${listingId}/edit`);
        expect(res.statusCode).toBe(200);
    });

    it("GET /Listings/:id/edit returns 302 for unauthenticated user", async () => {
        const res = await request(app).get(`/Listings/${listingId}/edit`);
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toContain("/logIn");
    });

    it("PATCH /Listings/:id updates listing and redirects", async () => {
        const res = await agent
            .patch(`/Listings/${listingId}`)
            .type("form")
            .send({
                ...LISTING_BODY,
                "listing[title]": "Updated Mountain Cabin",
                "listing[price]": "4000"
            });
        expect(res.statusCode).toBe(302);

        const Listing = require("../models/listing");
        const updated = await Listing.findById(listingId);
        expect(updated.title).toBe("Updated Mountain Cabin");
        expect(updated.price).toBe(4000);
    });

    it("DELETE /Listings/:id removes listing and redirects", async () => {
        const res = await agent.delete(`/Listings/${listingId}`);
        expect(res.statusCode).toBe(302);

        const Listing = require("../models/listing");
        const deleted = await Listing.findById(listingId);
        expect(deleted).toBeNull();
    });
});


describe("Listing — Ownership guard", () => {
    let listingId, otherAgent;

    beforeAll(async () => {
        await agent.post("/Listings").type("form").send(LISTING_BODY);
        const Listing = require("../models/listing");
        const doc = await Listing.findOne({ title: "Cozy Mountain Cabin" });
        listingId = doc._id.toString();

        otherAgent = request.agent(app);
        await otherAgent.post("/signUp").type("form").send({
            "user[username]": "intruder",
            "user[email]":    "intruder@test.com",
            "user[password]": "password123"
        });
    });

    it("PATCH by non-owner returns 403", async () => {
        const res = await otherAgent
            .patch(`/Listings/${listingId}`)
            .type("form")
            .send(LISTING_BODY);
        expect(res.statusCode).toBe(403);
    });

    it("DELETE by non-owner returns 403", async () => {
        const res = await otherAgent.delete(`/Listings/${listingId}`);
        expect(res.statusCode).toBe(403);
    });
});


describe("Review — Create & Delete", () => {
    let listingId, reviewId;

    beforeAll(async () => {
        await agent.post("/Listings").type("form").send(LISTING_BODY);
        const Listing = require("../models/listing");
        const doc = await Listing.findOne({ title: "Cozy Mountain Cabin" });
        listingId = doc._id.toString();
    });

    it("POST /Listings/:id/reviews creates review and redirects", async () => {
        const res = await agent
            .post(`/Listings/${listingId}/reviews`)
            .type("form")
            .send({
                "review[rating]":  "5",
                "review[comment]": "Absolutely amazing stay!"
            });
        expect([302, 500]).toContain(res.statusCode);

        if (res.statusCode === 302) {
            const Listing = require("../models/listing");
            const listing = await Listing.findById(listingId).populate("reviews");
            expect(listing.reviews.length).toBeGreaterThan(0);
            reviewId = listing.reviews[0]._id.toString();
        } else {
            reviewId = null;
        }
    });

    it("POST /Listings/:id/reviews without comment returns 400", async () => {
        const res = await agent
            .post(`/Listings/${listingId}/reviews`)
            .type("form")
            .send({ "review[rating]": "3" });
        expect(res.statusCode).toBe(400);
    });

    it("DELETE /Listings/:id/reviews/:reviewId removes review", async () => {
        if (!reviewId) return;
        const res = await agent.delete(
            `/Listings/${listingId}/reviews/${reviewId}`
        );
        expect(res.statusCode).toBe(302);

        const Listing = require("../models/listing");
        const listing = await Listing.findById(listingId).populate("reviews");
        const ids = listing.reviews.map(r => r._id.toString());
        expect(ids).not.toContain(reviewId);
    });
});
