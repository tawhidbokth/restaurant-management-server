const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yzegd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    // console.log(
    //   'Pinged your deployment. You successfully connected to MongoDB!'
    // );

    const foodsCollection = client.db('restaurantDB').collection('foods');
    const foodpurchaseCollection = client
      .db('restaurantDB')
      .collection('foods_purchase');
    const userCollection = client.db('restaurantDB').collection('users');

    app.post('/users', async (req, res) => {
      const user = req.body;

      try {
        // Check if the email already exists
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);

        if (existingUser) {
          return res.status(200).send({
            message: 'User already exists',
            insertedId: null,
          });
        }

        // Insert the new user
        const result = await userCollection.insertOne(user);
        return res.status(201).send({
          message: 'User successfully created',
          insertedId: result.insertedId,
        });
      } catch (error) {
        // Handle server errors
        console.error('Error inserting user:', error);
        res.status(500).send({
          message: 'Internal server error',
        });
      }
    });
    app.get('/users', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const limit = parseInt(req.query.limit) || 0; // Default: no limit
      const users = await userCollection.find(query).limit(limit).toArray();
      res.send(users);
    });

    app.get('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.findOne(query);
        if (!result) {
          res.status(404).send({ error: 'User not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch user' });
      }
    });

    app.get('/foods', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const limit = parseInt(req.query.limit) || 0; // Default: no limit
      const foods = await foodsCollection.find(query).limit(limit).toArray();
      res.send(foods);
    });

    app.get('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodsCollection.findOne(query);
        if (!result) {
          res.status(404).send({ error: 'Equipment not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch equipment' });
      }
    });

    app.post('/foods', async (req, res) => {
      try {
        const addItemList = req.body;
        const result = await foodsCollection.insertOne(addItemList);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to add equipment' });
      }
    });

    app.put('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: req.body,
        };

        const result = await foodsCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to update equipment' });
      }
    });

    app.get('/foods-purchase', async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await foodpurchaseCollection.find(query).toArray();
      console.log(result);
      for (const purchase of result) {
        const query1 = { _id: new ObjectId(purchase.food_id) };
        const food = await foodsCollection.findOne(query1);
        if (food) {
          purchase.foodName = food.foodName;
          purchase.price = food.price;
          purchase.hr_name = food.hr_name;
          purchase.foodImage = food.foodImage;
        }
      }
      res.send(result);
    });
    app.post('/foods-purchase', async (req, res) => {
      try {
        const purchase = req.body;
        console.log('Received data:', purchase);
        const result = await foodpurchaseCollection.insertOne(purchase);
        const id = purchase.food_id;
        const query = { _id: new ObjectId(id) };
        const food = await foodsCollection.findOne(query);
        let newCount = 0;
        if (food.purchaseCount) {
          newCount = food.purchaseCount + 1;
        } else {
          newCount = 1;
        }

        // now update the job info
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            purchaseCount: newCount,
          },
        };

        const updateResult = await foodsCollection.updateOne(
          filter,
          updatedDoc
        );
        res.send(result);
      } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).send({ error: 'Failed to process purchase' });
      }
    });
    app.delete('/foods-purchase/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodpurchaseCollection.deleteOne(query);
        if (result.deletedCount === 0) {
          res.status(404).send({ error: 'food not found' });
        } else {
          res.send(result);
        }
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete equipment' });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
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
