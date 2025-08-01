import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import transactionHistoryRoutes from "./routes/transactionHistoryRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import plannedPaymentRoutes from "./routes/plannedPaymentRoutes.js";
import retirementRoutes from "./routes/retirementRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";

// Get current directory and configure dotenv to look in the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); //Allowing the server to accept JSON data in req.body 

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transaction-history", transactionHistoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/planned-payments", plannedPaymentRoutes);
app.use("/api/retirement", retirementRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.listen(5000, () => {
    connectDB();
    console.log("Server is now running on http://localhost:5000");
    
    // Debug environment variables for AI Chatbot
    if (process.env.GEMINI_API_KEY) {
        console.log("✅ GEMINI_API_KEY loaded successfully");
    } else {
        console.warn("⚠️  GEMINI_API_KEY not found in environment variables");
        console.warn("   Please ensure you have a .env file in the root directory with GEMINI_API_KEY=your_api_key");
    }
});

