import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import User from "../models/users.js";
import mongoose from "mongoose";

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

// Delete
app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    console.log("id", id);

    try {
        await User.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ success: false, message: "Failed to delete user"});
    }
});

// Get
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch users"});
    }
});

// Update
app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const user = req.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid user ID"});
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(id, user, { new: true });
        res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({ success: false, message: "Failed to update user"});
    }
}); 

app.listen(5000, () => {
    connectDB();
    console.log("Server is now running on https://localhost:5000");
});

