 const mongoose = require('mongoose')
 require('dotenv').config();

 mongoose
   .connect(
     `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.w4wajhq.mongodb.net/?retryWrites=true&w=majority`,
     { useNewUrlParser: true, useUnifiedTopology: true }
   )
   .then(() => {
     console.log("Connected to MongoDB");
   })
   .catch((error) => {
     console.error("Error connecting to MongoDB:", error);
   });
