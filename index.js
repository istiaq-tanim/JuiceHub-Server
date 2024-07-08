const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()

const stripe = require('stripe')("sk_test_51NEZAfHvJD5yKaqm2WPRS4xsJgLABv05GevLiiX54kyFT2uq2ddj1qwIlbwYzP5Ls5mNyb8PzBr39HhOg797jEb1002AUPqZB8")
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjebueb.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db("juiceDB").collection("users");
    const juiceCollection = client.db("juiceDB").collection("juices");
    const cartCollection = client.db("juiceDB").collection("carts");
    const paymentCollection = client.db("juiceDB").collection("payments");
    const reviewCollection = client.db("juiceDB").collection("reviews");

    //juiceItem api

    app.get("/juiceItems", async (req, res) => {
      const result = await juiceCollection.find().toArray()
      res.send(result)
    })

    app.get("/juiceItem/:id", async (req, res) => {
      const id = req.params
      const item = { _id: new ObjectId(id) }
      const response = await juiceCollection.findOne(item)
      res.status(201).json({
        success: true,
        message: 'Juice Retrieved successfully',
        response
      });

    })
    app.post("/juiceItems", async (req, res) => {
      const juiceItems = req.body;
      const result = await juiceCollection.insertOne(juiceItems)
      res.send(result)
    })
    app.delete("/juiceItems/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await juiceCollection.deleteOne(query)
      res.send(result)
    })

    app.put("/juiceItems", async (req, res) => {
      const item = req.body;
      const id = item.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          name: item.name,
          price: item.price,
          category: item.category,
          ratings: item.ratings,
          description: item.description,
          available: item.available
        }
      };
      const result = await juiceCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.get("/popular", async (req, res) => {
      const products = await juiceCollection.find().sort({ sellNumber: -1 }).limit(6).toArray()
      res.send(products)
    })

    // users api

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existUser = await usersCollection.findOne(query)
      if (existUser) {
        return res.send({ message: "user exist" })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const query = { email: email }
      const result = await usersCollection.findOne(query)
      res.send(result)
    })

    app.put("/updateUser", async (req, res) => {
      const { email, user } = req.body;
      const query = { email: email }
      console.log(email, user)
      const updateDoc = {
        $set: {
          name: user.name,
          about: user.about,
          phone: user.phone,
          country: user.country,
          occupation: user.occupation,
          city: user.city,
          street: user.street,
          photo: user.photo,
          email: user.email,
          role: user.role
        }
      };
      const result = await usersCollection.updateOne(query, updateDoc)
      console.log(result)
      res.send(result)
    })

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: "admin"
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email }

      const user = await usersCollection.findOne(query)
      const result = { admin: user?.role === "admin" }
      res.send(result)
    })



    //cart api
    app.post("/addCart", async (req, res) => {
      const cartItem = req.body;

      const filter = { menuId: cartItem.menuId }
      const existItem = await cartCollection.findOne(filter)

      if (!existItem) {
        cartItem.orderQuantity = 1
        const result = await cartCollection.insertOne(cartItem)
        res.send(result)
      }
      else {
        const updateCart = { ...existItem, orderQuantity: existItem.orderQuantity + 1 }
        const result = await cartCollection.updateOne(filter, { $set: updateCart });
        res.send(result)
      }

    })

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const query = { email: email }
      const result = await cartCollection.find(query).toArray()
      res.send(result)

    })
    app.patch("/incrementCart/:id", async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const existProduct = await cartCollection.findOne(filter)
      if (existProduct) {
        const updateCart = { ...existProduct, orderQuantity: existProduct.orderQuantity + 1 }
        const result = await cartCollection.updateOne(filter, { $set: updateCart })
        res.send(result)
      }
    })
    app.patch("/decrementCart/:id", async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const existProduct = await cartCollection.findOne(filter)
      if (existProduct.orderQuantity > 1) {
        const updateCart = { ...existProduct, orderQuantity: existProduct.orderQuantity - 1 }
        const result = await cartCollection.updateOne(filter, { $set: updateCart })
        res.send(result)
      }
      else {
        const result = await cartCollection.deleteOne(filter)
        res.send(result)
      }
    })
    app.delete("/deleteCart/:id", async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(filter)
      res.send(result)
    })


    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    //review

    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().sort({ rating: -1 }).limit(4).toArray();
      res.send(result)
    })

    //user Review

    app.post('/addReview', async (req, res) => {
      const { productId, review } = req.body;
      try {
        const result = await juiceCollection.updateOne(
          { _id: new ObjectId(productId) },
          { $push: { reviews: { ...review, date: new Date() } } }
        );
        await reviewCollection.insertOne(review)

        if (result.modifiedCount === 0) {
          return res.status(404).send('Product not found');
        }
        res.send(result)
      } catch (error) {
        res.status(500).send('Server error');
      }
    });

    // payment 

    app.post("/payment", async (req, res) => {
      const items = req.body;
      const insertResult = await paymentCollection.insertOne(items)
      const productIds = items.menuItems.map((id) => new ObjectId(id));
      const updateResult = await juiceCollection.updateMany(
        { _id: { $in: productIds } },
        { $inc: { sellNumber: 1, available: -1 } }
      );

      const query = { _id: { $in: items.cartItems.map(id => new ObjectId(id)) } }
      const deleteResult = cartCollection.deleteMany(query)
      res.send({ insertResult, updateResult, deleteResult })

    })

    app.get("/payment", async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await paymentCollection.find(query).sort({ date: -1 }).toArray()
      res.send(result)
    })

    app.get("/adminHome", async (req, res) => {
      const query = { role: "user" }
      const customers = await usersCollection.find(query).toArray()
      const products = await juiceCollection.estimatedDocumentCount()
      const orders = await cartCollection.estimatedDocumentCount()
      const totalCustomers = customers.length;
      const payment = await paymentCollection.find().toArray()

      const revenue = parseFloat(payment.reduce((sum, item) => sum + item.price, 0).toFixed(2))
      const adminStat = {
        totalCustomers,
        revenue,
        orders,
        products
      }
      res.send(adminStat)
    })

    app.get("/userHome", async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const reviews = await reviewCollection.find(query).toArray()
      const reviewCount = reviews.length
      const carts = await cartCollection.find(query).toArray()
      const cartsCount = carts.length;
      const payments = await paymentCollection.find(query).toArray()
      const paymentCounts = payments.length;

      const shop = parseFloat(payments.reduce((sum, item) => sum + item.price, 0).toFixed(2))
      const stat =
      {
        reviewCount,
        cartsCount,
        paymentCounts, shop
      }
      res.send(stat)
    })

    app.get('/payments/last-year', async (req, res) => {
      const email = req.query.email;

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const pipeline = [
        {
          $match: {
            email: email,
            date: { $gte: oneYearAgo.toISOString() }
          }
        },
        {
          $addFields: {
            dateParsed: { $dateFromString: { dateString: "$date" } }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$dateParsed" },
              month: { $month: "$dateParsed" }
            },
            totalAmount: { $sum: "$price" },
            transactions: { $push: "$$ROOT" }
          }
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1 }
        }
      ];

      console.log('Pipeline:', JSON.stringify(pipeline, null, 2));

      const transactions = await paymentCollection.aggregate(pipeline).toArray();
      res.send(transactions)

    });

    app.get('/orderStats', async (req, res) => {
      const pipeline = [
        {
          $addFields: {
            juicesItemsObjectIds: {
              $map: {
                input: "$menuItems",
                as: "itemId",
                in: { $toObjectId: "$$itemId" }
              }
            }
          }
        }
        ,
        {
          $lookup: {
            from: 'juices',
            localField: 'juicesItemsObjectIds',
            foreignField: '_id',
            as: 'juicesItemsData'
          }
        },
        {
          $unwind: '$juicesItemsData'
        },
        {
          $group: {
            _id: '$juicesItemsData.category',
            count: { $sum: 1 },
            total: { $sum: '$juicesItemsData.price' }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            total: { $round: ['$total', 2] },
            _id: 0
          }
        }

      ];

      const result = await paymentCollection.aggregate(pipeline).toArray()
      res.send(result)

    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Juice is Coming')
})

app.listen(port, () => {
  console.log(`Juice Hub listening on port ${port}`)
})




