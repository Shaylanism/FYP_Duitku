import express from "express";
import User from "../../models/users.js";
import mongoose from "mongoose";

const router = express.Router();

//Create
router.post("/", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
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
router.get("/", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch users"});
    }
});

// Update
router.put("/:id", async (req, res) => {
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

export default router;