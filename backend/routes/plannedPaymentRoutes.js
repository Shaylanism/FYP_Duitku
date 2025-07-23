import express from "express";
import authMiddleware from "../middleware/auth.js";
import PlannedPaymentController from "../controllers/PlannedPaymentController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Planned payment routes - delegating to controller
router.post("/", (req, res) => PlannedPaymentController.createPlannedPayment(req, res));
router.get("/", (req, res) => PlannedPaymentController.getPlannedPayments(req, res));
router.get("/notifications", (req, res) => PlannedPaymentController.getNotifications(req, res));
router.get("/reminders", (req, res) => PlannedPaymentController.getPaymentsDueForReminders(req, res));
router.get("/:id", (req, res) => PlannedPaymentController.getPlannedPaymentById(req, res));
router.put("/:id", (req, res) => PlannedPaymentController.updatePlannedPayment(req, res));
router.put("/:id/settle", (req, res) => PlannedPaymentController.markAsSettled(req, res));
router.delete("/:id", (req, res) => PlannedPaymentController.deletePlannedPayment(req, res));

export default router; 