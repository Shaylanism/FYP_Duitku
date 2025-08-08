import express from "express";
import authMiddleware from "../middleware/auth.js";
import UserController from "../controllers/UserController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// User routes - directly using controller methods
router.post("/", UserController.createUser);
router.get("/", UserController.getUsers);
router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);

export default router;