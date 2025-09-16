import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import { connectDB } from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import routes from "./routes/api.js";

const forms = multer();

// App config
dotenv.config();
const app = express();

const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();


// Middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
routes(app, forms);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
