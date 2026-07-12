const express = require("express");
const app = express();
const dotenv = require("dotenv");
const PORT = process.env.PORT || 5000;
dotenv.config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-node-cjs-runtime");

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let clientPromise = global._mongoClientPromise;
if (!clientPromise) {
  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
}

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URI}/api/auth/jwks`),
);

const middleWare = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header)
      return res.status(401).json({ error: "No authorization header" });
    const { payload } = await jwtVerify(header, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to attach collections once DB is connected
app.use(async (req, res, next) => {
  await clientPromise;
  const db = client.db("apointment_db");
  req.doctorCollection = db.collection("doctors");
  req.apointmentCollection = db.collection("apointments");
  next();
});

app.get("/", (req, res) => res.send("Server is running fine!"));

app.get("/doctors", async (req, res) => {
  const result = await req.doctorCollection.find().toArray();
  res.send(result);
});

app.get("/doctors/:id", middleWare, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) {
      return res
        .status(400)
        .json({ error: "Invalid ID format. Must be 24 hex characters." });
    }
    const result = await req.doctorCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!result)
      return res.status(404).json({ error: "No doctor found with this ID" });
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/doctors/cheap", async (req, res) => {
  try {
    const doctors = await req.doctorCollection
      .find()
      .sort({ experience: 1 })
      .limit(3)
      .toArray();
    res.status(200).json(doctors);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching doctors", error: error.message });
  }
});

app.get("/apointments", middleWare, async (req, res) => {
  const result = await req.apointmentCollection.find().toArray();
  res.send(result);
});

app.post("/apointments", async (req, res) => {
  const bookingApoint = req.body;
  await req.apointmentCollection.insertOne(bookingApoint);
  res.send(bookingApoint);
});

app.patch("/apointments/:id", async (req, res) => {
  const { id } = req.params;
  const updatedApointment = req.body;
  const result = await req.apointmentCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedApointment },
  );
  res.send(result);
});

app.delete("/apointments/:id", async (req, res) => {
  const { id } = req.params;
  const result = await req.apointmentCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
