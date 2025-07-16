import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(express.json()); //Allowing the server to accept JSON data in req.body 

app.use("/api/users", userRoutes);

app.listen(5000, () => {
    connectDB();
    console.log("Server is now running on https://localhost:5000");
});

