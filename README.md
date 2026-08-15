# StayEase 🏡

> A full-stack Airbnb-style property listing and booking platform built with Node.js, Express, MongoDB, and EJS.

🔗 **[Live Demo → stayease-lxtz.onrender.com](https://stayease-lxtz.onrender.com/Listings)**

![StayEase — Explore Stays](preview.jpg)

---

## Features

| Feature | Details |
|---|---|
| 🔍 **Browse & Search** | Paginated listing grid with full-text search (title, city, country) + category filters |
| 🏠 **Listings CRUD** | Create, edit, delete listings with Cloudinary image upload |
| ⭐ **Reviews** | Star ratings + comments; average rating recalculated on every change |
| 📅 **Bookings** | Date picker with live price estimate; overlap detection prevents double-booking |
| 🔐 **Auth** | Passport.js local strategy; rate-limited login (10 req / 15 min) |
| 🛡 **Security** | CSRF protection (lusca), Helmet CSP headers, XSS sanitization, ownership guards |
| 📱 **Responsive** | Mobile-first Bootstrap 5 grid |

---

## Getting Started

### Prerequisites

- Node.js **v20+**
- MongoDB Atlas ([free tier](https://www.mongodb.com/cloud/atlas)) or local MongoDB
- [Cloudinary](https://cloudinary.com/) account (free tier)

### Installation

```bash
git clone <repo-url>
cd PROJECT
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `SESSION_SECRET` | Long random string for signing sessions |
| `CLOUD_NAME` | Cloudinary cloud name |
| `CLOUD_API_KEY` | Cloudinary API key |
| `CLOUD_API_SECRET` | Cloudinary API secret |

### Running Locally

```bash
node index.js
```

Server starts on **http://localhost:8080** by default. Override with `PORT=<port>` in `.env`.

### Seed the Database

```bash
node init/index.js
```

---

## Docker

```bash
docker build -t stayease .

docker run -p 8080:8080 \
  -e MONGO_URI="..." \
  -e SESSION_SECRET="..." \
  -e CLOUD_NAME="..." \
  -e CLOUD_API_KEY="..." \
  -e CLOUD_API_SECRET="..." \
  stayease
```

---

## Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/Listings` | — | All listings (`?page`, `?limit`, `?query`) |
| GET | `/Listings/new` | ✅ | New listing form |
| POST | `/Listings` | ✅ | Create listing |
| GET | `/Listings/:id` | — | Listing detail |
| GET | `/Listings/:id/edit` | ✅ Owner | Edit form |
| PATCH | `/Listings/:id` | ✅ Owner | Update listing |
| DELETE | `/Listings/:id` | ✅ Owner | Delete listing |
| POST | `/Listings/:id/reviews` | ✅ | Add review |
| DELETE | `/Listings/:id/reviews/:reviewId` | ✅ Author | Delete review |
| POST | `/Listings/:id/bookings` | ✅ | Book a listing |
| GET | `/bookings` | ✅ | My bookings |
| PATCH | `/bookings/:id/cancel` | ✅ Guest | Cancel booking |
| GET | `/signUp` | — | Sign up form |
| POST | `/signUp` | — | Register |
| GET | `/logIn` | — | Login form |
| POST | `/logIn` | — | Authenticate |
| GET | `/logOut` | ✅ | Logout |
| GET | `/health` | — | Health check |

---

## Project Structure

```
├── config/          Cloudinary config
├── controllers/     Route handler logic
├── errors/          Custom error classes
├── init/            DB seed scripts
├── middleware/      Auth, validation, error handler, upload
├── models/          Mongoose schemas
├── public/          CSS, JS, favicon
├── routes/          Express routers
├── schemas/         Joi validation schemas
├── utils/           wrapAsync, findOrFail, cloudinaryUpload
├── views/           EJS templates
├── Dockerfile
├── app.js           Express app (middleware + routes)
└── index.js         DB connect + server start
```

## License

MIT
