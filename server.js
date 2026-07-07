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

    app.get('/doctors', async(req,res) => {
      const result = await doctorCollection.find().toArray()
      res.send(result)
    })

    app.get("/doctors/:id", async (req, res) => {
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

    app.get('/apointments', async(req,res) => {
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
        _id: ObjectId(id),
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