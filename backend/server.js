import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); //Allowing the server to accept JSON data in req.body 

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);

app.listen(5000, () => {
    connectDB();
    console.log("Server is now running on http://localhost:5000");
});

