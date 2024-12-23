const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yzegd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );

    const database = client.db('restaurantDB');
    const foodsCollection = database.collection('foods');

    app.get('/foods', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 0; // Default: no limit
        const foods = await foodsCollection.find().limit(limit).toArray();
        res.send(foods);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch data' });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
// Base route
app.get('/', (req, res) => {
  res.send('Welcome to restrurant  API server!');
});

// Start server
app.listen(port, () => {
  console.log('Server running on port', port);
});
