import User from "../models/User.js";
import mongoose from "mongoose";

class UserController {
    // Create user (Admin function)
    async createUser(req, res) {
        try {
            const { name, email } = req.body; // Only name and email for admin creation

            if (!name || !email) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Name and email are required" 
                });
            }

            // Checks if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: "User with this email already exists" 
                });
            }

            //Creates a user with default password (they should change it)
            const newUser = new User({ name, email, password: "temppassword123" });
            
            await newUser.save();
            
            // Returns user without password
            const userResponse = {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt
            };
            
            res.status(201).json({ 
                success: true, 
                message: "User created successfully", 
                user: userResponse 
            });
        } catch (error) {
            console.error("Error creating user:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to create user"
            });
        }
    }

    // Get all users
    async getUsers(req, res) {
        try {
            const users = await User.find({}).select("-password"); // Exclude password field
            res.status(200).json({ success: true, users });
        } catch (error) {
            console.error("Error fetching users:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to fetch users"
            });
        }
    }

    // Update user
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, email } = req.body; // Only allow updating name and email

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid user ID"
                });
            }

            const updatedUser = await User.findByIdAndUpdate(
                id, 
                { name, email }, 
                { new: true }
            ).select("-password");
            
            res.status(200).json({ 
                success: true, 
                message: "User updated successfully", 
                user: updatedUser 
            });
        } catch (error) {
            console.error("Error updating user:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to update user"
            });
        }
    }

    // Delete user
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            await User.findByIdAndDelete(id);
            res.status(200).json({ 
                success: true, 
                message: "User deleted successfully" 
            });
        } catch (error) {
            console.error("Error deleting user:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to delete user"
            });
        }
    }
}

export default new UserController(); 