# Doctor Appointment Manager — Backend

REST API server for the Doctor Appointment Manager application. Handles doctor listings, appointment booking, and JWT-based authentication verification. Built with Express and MongoDB, deployed on Render.

**Base URL:** `https://doctor-apoint-server.onrender.com`

## Features

- 📋 Fetch doctor listings and individual doctor profiles
- 📅 Create, update, and delete appointments
- 🔐 JWT verification via JWKS (integrates with the frontend's Better Auth setup)
- 🌐 CORS-enabled for cross-origin requests from the frontend

## Tech Stack

- **Runtime:** Node.js
- **Framework:** [Express](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) (native driver)
- **Auth:** JWT verification via [`jose`](https://github.com/panva/jose) using a remote JWKS endpoint
- **Deployment:** [Render](https://render.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (e.g. MongoDB Atlas)
- The [frontend app](#) running and exposing a `/api/auth/jwks` endpoint (for JWT verification)

### Installation

```bash
git clone https://github.com/<your-username>/doctor-apoint-server.git
cd doctor-apoint-server
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
CLIENT_URI=http://localhost:3000
```

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (defaults to `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `CLIENT_URI` | URL of the deployed/running frontend, used to build the JWKS endpoint (`${CLIENT_URI}/api/auth/jwks`) for verifying auth tokens |

> ⚠️ Never commit `.env` or real credentials. Rotate any secrets that have been exposed.

### Run the server

```bash
node server.js
```

Or with auto-restart during development:

```bash
npx nodemon server.js
```

The server will start on `http://localhost:5000` (or the port set in `PORT`).

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/` | No | Health check |
| `GET` | `/doctors` | No | Get list of all doctors |
| `GET` | `/doctors/:id` | Yes | Get a single doctor by ID |
| `GET` | `/api/doctors/cheap` | No | Get 3 doctors sorted by lowest experience |
| `GET` | `/apointments` | Yes | Get all appointments |
| `POST` | `/apointments` | No | Create a new appointment |
| `PATCH` | `/apointments/:id` | No | Update an existing appointment |
| `DELETE` | `/apointments/:id` | No | Delete an appointment |

### Authentication

Protected routes expect an `Authorization` header containing a valid JWT issued by the frontend's Better Auth instance:

```
Authorization: <token>
```

Tokens are verified against the frontend's JWKS endpoint (`${CLIENT_URI}/api/auth/jwks`) using `jose`.

## Project Structure

```
server.js       # Express app, routes, DB connection, JWT middleware
.env            # Environment variables (not committed)
```

## Deployment

This project is deployed on **Render** as a Web Service.

Make sure the following environment variables are set in **Render → your service → Environment**:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `CLIENT_URI` | Deployed frontend URL (e.g. `https://doctor-apoint.vercel.app`) — no trailing slash or whitespace |
| `PORT` | Usually auto-set by Render |

> If `CLIENT_URI` is missing or malformed, the server will fail to start since the JWKS URL is constructed at startup.

## Related Repositories

- [Frontend (Next.js)](#)

## License

This project is licensed under the MIT License.
