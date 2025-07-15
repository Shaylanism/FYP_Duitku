import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
}, { 
    timestamps: true //Example: createdAt and updatedAt.
 });

 const User = mongoose.model("User", userSchema);

 export default User;