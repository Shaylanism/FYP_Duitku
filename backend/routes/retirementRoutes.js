import express from "express";
import authMiddleware from "../middleware/auth.js";
import RetirementPlanController from "../controllers/RetirementPlanController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Retirement plan routes - binding controller methods to maintain context
router.post("/calculate", RetirementPlanController.calculateRetirementPlan.bind(RetirementPlanController));
router.get("/", RetirementPlanController.getRetirementPlan.bind(RetirementPlanController));
router.delete("/", RetirementPlanController.deleteRetirementPlan.bind(RetirementPlanController));

export default router; 