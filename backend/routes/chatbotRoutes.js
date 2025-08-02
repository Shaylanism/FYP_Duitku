import express from "express";
import ChatbotController from "../controllers/ChatbotController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const chatbotController = new ChatbotController();

// All chatbot routes require authentication
router.use(authMiddleware);

// Chat with AI
router.post("/chat", chatbotController.chat.bind(chatbotController));

// Get conversation history
router.get("/history", chatbotController.getConversationHistory.bind(chatbotController));

// Clear all conversation history
router.post("/clear", chatbotController.clearConversation.bind(chatbotController));

// Start new chat (archive current conversation)
router.post("/start-new", chatbotController.startNewChat.bind(chatbotController));

// Get archived conversation (read-only)
router.get("/archived", chatbotController.getArchivedConversation.bind(chatbotController));

// Health check endpoint for debugging
router.get("/health", (req, res) => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const maskedKey = hasApiKey ? 
        `${process.env.GEMINI_API_KEY.substring(0, 4)}...${process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 4)}` : 
        'Not set';
    
    // Test the controller initialization
    const genAI = chatbotController.initializeAI();
    
    res.json({
        success: true,
        status: 'AI Chatbot Service',
        apiKeyConfigured: hasApiKey,
        apiKeyPreview: maskedKey,
        aiServiceInitialized: !!genAI,
        timestamp: new Date().toISOString()
    });
});

export default router;