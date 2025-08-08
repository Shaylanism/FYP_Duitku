import express from "express";
import authMiddleware from "../middleware/auth.js";
import PlannedPaymentController from "../controllers/PlannedPaymentController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Planned payment routes - directly using controller methods
router.post("/", PlannedPaymentController.createPlannedPayment);
router.get("/", PlannedPaymentController.getPlannedPayments);
router.get("/notifications", PlannedPaymentController.getNotifications);
router.get("/reminders", PlannedPaymentController.getPaymentsDueForReminders);
router.get("/:id", PlannedPaymentController.getPlannedPaymentById);
router.put("/:id", PlannedPaymentController.updatePlannedPayment);
router.put("/:id/settle", PlannedPaymentController.markAsSettled);
router.delete("/:id", PlannedPaymentController.deletePlannedPayment);

export default router; 