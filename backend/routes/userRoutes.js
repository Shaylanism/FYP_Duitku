import express from "express";
import authMiddleware from "../middleware/auth.js";
import UserController from "../controllers/UserController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// User routes - delegating to controller
router.post("/", (req, res) => UserController.createUser(req, res));
router.get("/", (req, res) => UserController.getUsers(req, res));
router.put("/:id", (req, res) => UserController.updateUser(req, res));
router.delete("/:id", (req, res) => UserController.deleteUser(req, res));

export default router;