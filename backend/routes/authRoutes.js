import express from "express";
import AuthController from "../controllers/AuthController.js";

const router = express.Router();

// Auth routes - delegating to controller
router.post("/register", (req, res) => AuthController.register(req, res));
router.post("/login", (req, res) => AuthController.login(req, res));
router.get("/verify", (req, res) => AuthController.verifyToken(req, res));

export default router; 