const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const cors = require('cors')

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const uri = process.env.MONGODB_URI;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require('jose-node-cjs-runtime')

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    const db = client.db("apointment_db");
    const doctorCollection = db.collection('doctors');
    const apointmentCollection = db.collection('apointments');


     const JWKS = createRemoteJWKSet(
      new URL("http://localhost:3000/api/auth/jwks"),
    );


   const middleWare = async (req, res, next) => {
     try {
       const header = req.headers.authorization;

       if (!header) {
         return res.status(401).json({ error: "No authorization header" });
       }

       const token =  header;

       const { payload } = await jwtVerify(token, JWKS);
       req.user = payload; 
      console.log(payload);
       next();
     } catch (error) {
       console.error("JWT verification failed:", error.message);
       return res.status(401).json({ error: "Invalid or expired token" });
     }
   };


    app.get("/doctors", async (req, res) => {
        const result = await doctorCollection.find().toArray();
        res.send(result);
      });

    app.get("/doctors/:id", middleWare ,async (req, res) => {
      try {
        const { id } = req.params;
        
        if (!id || id.length !== 24) {
          return res
            .status(400)
            .json({ error: "Invalid ID format. Must be 24 hex characters." });
        }

        const result = await doctorCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res
            .status(404)
            .json({ error: "No doctor found with this ID" });
        }

        res.send(result);
      } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/doctors/cheap", async (req, res) => {
      try {
        const doctors = await doctorCollection
          .find()
          .sort({ experience: 1 })
          .limit(3)
          .toArray(); // needed since you're using the native MongoDB driver

        res.status(200).json(doctors);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error fetching doctors", error: error.message });
      }
    });

    app.get('/apointments',middleWare,async(req,res) => {
      const result = await apointmentCollection.find().toArray();

      res.send(result);
    })

    app.post('/apointments', async(req,res) => {
      const bookingApoint = req.body
      const result = apointmentCollection.insertOne(bookingApoint)

      res.send(bookingApoint)
    })

    app.patch('/apointments/:id', async(req,res) => {
      const {id} = req.params
      const updatedApointment = req.body
      const result = await apointmentCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updatedApointment}
      )

      res.send(result);
    })
    
    app.delete("/apointments/:id", async (req, res) => {
      const { id } = req.params;
      const result = await apointmentCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });
  }
  catch(err){
    console.log(err);
  }
}
run().catch(console.dir);

app.get('/', (req,res) => {
  res.send('Server is running fine!');
})


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})