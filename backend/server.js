import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import User from "../models/users.js";

dotenv.config();

const app = express();

app.use(express.json()); //Allowing the server to accept JSON data in req.body

//Create
app.post("/api/users", async (req, res) => {
    const user = req.body; // User sends name and email.

    if (!user.name || !user.email) {
        return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const newUser = new User(user);
    
    try {
        await newUser.save();
        res.status(201).json({ success: true, message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("Error creating user:", error.message);
        res.status(500).json({ success: false, message: "Failed to create user"});
    }
});

app.listen(5000, () => {
    connectDB();
    console.log("Server is now running on https://localhost:5000");
});

