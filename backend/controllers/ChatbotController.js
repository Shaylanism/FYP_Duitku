import { GoogleGenerativeAI } from '@google/generative-ai';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import PlannedPayment from '../models/PlannedPayment.js';
import RetirementPlan from '../models/RetirementPlan.js';

class ChatbotController {
    constructor() {
        this.genAI = null;
        this.initialized = false;
    }

    // Lazy initialization of the AI service
    initializeAI() {
        if (this.initialized) {
            return this.genAI;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ ChatbotController: GEMINI_API_KEY not found in environment variables');
            console.error('   Please add GEMINI_API_KEY=your_api_key to your .env file in the root directory');
            this.genAI = null;
        } else {
            console.log('✅ ChatbotController: GEMINI_API_KEY loaded successfully');
            // Only log first and last 4 characters for security
            const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
            console.log(`   API Key: ${maskedKey}`);
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
        
        this.initialized = true;
        return this.genAI;
    }

    // Get user's financial summary for AI context
    async getUserFinancialContext(userId) {
        try {
            const [transactions, budgets, plannedPayments, retirementPlan] = await Promise.all([
                Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
                Budget.find({ user: userId }),
                PlannedPayment.find({ user: userId }),
                RetirementPlan.findOne({ user: userId })
            ]);

            // Calculate financial summary
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthlyTransactions = transactions.filter(t => 
                t.createdAt.toISOString().slice(0, 7) === currentMonth
            );

            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
            const budgetSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);

            const overduePayments = plannedPayments.filter(p => 
                !p.isSettled && new Date(p.dueDate) < new Date()
            );

            return {
                monthlyIncome,
                monthlyExpenses,
                netIncome: monthlyIncome - monthlyExpenses,
                totalBudget,
                budgetSpent,
                budgetRemaining: totalBudget - budgetSpent,
                overduePaymentsCount: overduePayments.length,
                totalOverdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
                hasRetirementPlan: !!retirementPlan,
                recentTransactionsCount: transactions.length,
                plannedPaymentsCount: plannedPayments.length,
                budgetsCount: budgets.length
            };
        } catch (error) {
            console.error('Error getting user financial context:', error);
            return null;
        }
    }

    // Generate financial advice prompt
    generateFinancialPrompt(userMessage, financialContext) {
        const contextPrompt = financialContext ? `
Current Financial Context:
- Monthly Income: RM${financialContext.monthlyIncome.toFixed(2)}
- Monthly Expenses: RM${financialContext.monthlyExpenses.toFixed(2)}
- Net Income: RM${financialContext.netIncome.toFixed(2)}
- Total Budget: RM${financialContext.totalBudget.toFixed(2)}
- Budget Spent: RM${financialContext.budgetSpent.toFixed(2)}
- Budget Remaining: RM${financialContext.budgetRemaining.toFixed(2)}
- Overdue Payments: ${financialContext.overduePaymentsCount} (Total: RM${financialContext.totalOverdueAmount.toFixed(2)})
- Has Retirement Plan: ${financialContext.hasRetirementPlan ? 'Yes' : 'No'}
- Recent Transactions: ${financialContext.recentTransactionsCount}
- Active Budgets: ${financialContext.budgetsCount}
- Planned Payments: ${financialContext.plannedPaymentsCount}
        ` : '';

        return `You are Duitku AI, a helpful financial advisor assistant for the Duitku financial management app. 
        
You help users with:
- General financial advice and education
- Budgeting strategies
- Savings recommendations
- Investment guidance
- Retirement planning
- Expense tracking tips
- Debt management advice
- Analysis of their current financial situation

${contextPrompt}

User Question: ${userMessage}

Please provide helpful, accurate financial advice. If the user asks about their specific financial data and you have their context, reference their actual numbers. Keep responses concise but informative. Always encourage responsible financial habits.

If you don't have access to their specific financial data, provide general advice and suggest they check their dashboard for detailed insights.`;
    }

    // Main chat endpoint
    async chat(req, res) {
        try {
            const { message } = req.body;
            const userId = req.user._id;

            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid message'
                });
            }

            // Initialize AI service on first use
            const genAI = this.initializeAI();
            
            if (!genAI) {
                console.error('❌ ChatbotController.chat: AI service not initialized - GEMINI_API_KEY missing');
                return res.status(500).json({
                    success: false,
                    message: 'AI service is not configured. Please ensure GEMINI_API_KEY is set in your environment variables.',
                    error: 'MISSING_API_KEY'
                });
            }

            // Get user's financial context
            const financialContext = await this.getUserFinancialContext(userId);

            // Generate AI response
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const prompt = this.generateFinancialPrompt(message, financialContext);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiMessage = response.text();

            res.json({
                success: true,
                message: aiMessage,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Chatbot error:', error);
            console.error('   Error details:', {
                message: error.message,
                stack: error.stack?.split('\n')[0] // Only log first line of stack trace
            });
            
            // Handle specific API errors
            if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('INVALID_API_KEY')) {
                return res.status(500).json({
                    success: false,
                    message: 'AI service configuration error. Please check your API key.',
                    error: 'INVALID_API_KEY'
                });
            }

            if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                return res.status(429).json({
                    success: false,
                    message: 'AI service is temporarily unavailable. Please try again later.',
                    error: 'QUOTA_EXCEEDED'
                });
            }

            if (error.message?.includes('SAFETY')) {
                return res.status(400).json({
                    success: false,
                    message: 'Your message was blocked for safety reasons. Please try rephrasing your question.',
                    error: 'SAFETY_FILTER'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Sorry, I encountered an error processing your request. Please try again.',
                error: 'UNKNOWN_ERROR'
            });
        }
    }

    // Get conversation history (if we want to implement this later)
    async getConversationHistory(req, res) {
        try {
            // For now, return empty as we're not storing conversation history
            // This can be extended later if needed
            res.json({
                success: true,
                conversations: [],
                message: 'Conversation history not implemented yet'
            });
        } catch (error) {
            console.error('Error getting conversation history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversation history'
            });
        }
    }
}

export default ChatbotController;