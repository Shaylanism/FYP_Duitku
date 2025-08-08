import express from "express";
import AuthController from "../controllers/AuthController.js";

const router = express.Router();

// Auth routes - binding controller methods to maintain context
router.post("/register", AuthController.register.bind(AuthController));
router.post("/login", AuthController.login.bind(AuthController));
router.get("/verify", AuthController.verifyToken.bind(AuthController));

export default router; 