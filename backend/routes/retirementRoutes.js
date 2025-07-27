import express from "express";
import authMiddleware from "../middleware/auth.js";
import RetirementPlanController from "../controllers/RetirementPlanController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Retirement plan routes - delegating to controller
router.post("/calculate", (req, res) => RetirementPlanController.calculateRetirementPlan(req, res));
router.get("/", (req, res) => RetirementPlanController.getRetirementPlan(req, res));
router.delete("/", (req, res) => RetirementPlanController.deleteRetirementPlan(req, res));

export default router; 