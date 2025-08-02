import { GoogleGenerativeAI } from '@google/generative-ai';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import PlannedPayment from '../models/PlannedPayment.js';
import RetirementPlan from '../models/RetirementPlan.js';
import Conversation from '../models/Conversation.js';

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

    // Get user's enhanced financial summary for AI context
    async getUserFinancialContext(userId) {
        try {
            const [transactions, budgets, plannedPayments, retirementPlan] = await Promise.all([
                Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50),
                Budget.find({ user: userId }),
                PlannedPayment.find({ user: userId, isActive: true }),
                RetirementPlan.findOne({ user: userId })
            ]);

            const currentMonth = new Date().toISOString().slice(0, 7);
            const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
            const last3Months = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 7);

            // Current month analysis
            const monthlyTransactions = transactions.filter(t =>
                t.createdAt.toISOString().slice(0, 7) === currentMonth
            );

            // Last month comparison
            const lastMonthTransactions = transactions.filter(t =>
                t.createdAt.toISOString().slice(0, 7) === lastMonth
            );

            // 3-month trends
            const last3MonthsTransactions = transactions.filter(t =>
                t.createdAt.toISOString().slice(0, 7) >= last3Months
            );

            // Income/Expense analysis
            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const lastMonthIncome = lastMonthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const lastMonthExpenses = lastMonthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            // Category-wise spending analysis
            const expensesByCategory = {};
            const incomeByCategory = {};
            
            monthlyTransactions.forEach(t => {
                if (t.type === 'expense') {
                    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
                } else {
                    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
                }
            });

            const topExpenseCategories = Object.entries(expensesByCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);

            // Budget analysis - get current month budgets
            const currentMonthBudgets = budgets.filter(b => b.month === currentMonth);
            const totalBudget = currentMonthBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
            
            // Calculate budget spent by matching transactions to budget categories
            const budgetUtilization = currentMonthBudgets.map(budget => {
                const categorySpent = monthlyTransactions
                    .filter(t => t.type === 'expense' && t.category === budget.category)
                    .reduce((sum, t) => sum + t.amount, 0);
                
                return {
                    category: budget.category,
                    budgeted: budget.budgetAmount,
                    spent: categorySpent,
                    remaining: budget.budgetAmount - categorySpent,
                    utilizationRate: budget.budgetAmount > 0 ? (categorySpent / budget.budgetAmount * 100) : 0
                };
            });

            const overBudgetCategories = budgetUtilization.filter(b => b.spent > b.budgeted);
            const totalBudgetSpent = budgetUtilization.reduce((sum, b) => sum + b.spent, 0);

            // Planned payments analysis
            const overduePayments = plannedPayments.filter(p => p.isOverdue());
            const upcomingPayments = plannedPayments.filter(p => 
                p.isDueThisMonth() && !p.isOverdue()
            );

            // Financial health calculations
            const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;
            const incomeChange = lastMonthIncome > 0 ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
            const expenseChange = lastMonthExpenses > 0 ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses * 100) : 0;

            // 3-month averages
            const avg3MonthIncome = last3MonthsTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0) / 3;

            const avg3MonthExpenses = last3MonthsTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0) / 3;

            return {
                // Current month data
                monthlyIncome,
                monthlyExpenses,
                netIncome: monthlyIncome - monthlyExpenses,
                
                // Comparison data
                lastMonthIncome,
                lastMonthExpenses,
                incomeChange,
                expenseChange,
                avg3MonthIncome,
                avg3MonthExpenses,
                
                // Category analysis
                topExpenseCategories,
                totalExpenseCategories: Object.keys(expensesByCategory).length,
                
                // Budget analysis
                totalBudget,
                totalBudgetSpent,
                budgetRemaining: totalBudget - totalBudgetSpent,
                budgetUtilizationRate: totalBudget > 0 ? (totalBudgetSpent / totalBudget * 100) : 0,
                overBudgetCategoriesCount: overBudgetCategories.length,
                budgetUtilization,
                
                // Planned payments
                overduePaymentsCount: overduePayments.length,
                totalOverdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
                upcomingPaymentsCount: upcomingPayments.length,
                totalUpcomingAmount: upcomingPayments.reduce((sum, p) => sum + p.amount, 0),
                
                // Financial health indicators
                savingsRate,
                hasPositiveCashFlow: monthlyIncome > monthlyExpenses,
                
                // Retirement planning
                hasRetirementPlan: !!retirementPlan,
                retirementPlanDetails: retirementPlan ? {
                    yearsToRetirement: retirementPlan.yearsToRetirement,
                    monthlyEpfContribution: retirementPlan.monthlyEpfContribution,
                    additionalSavingsRequired: retirementPlan.additionalMonthlySavingsRequired
                } : null,
                
                // Summary counts
                recentTransactionsCount: transactions.length,
                plannedPaymentsCount: plannedPayments.length,
                budgetsCount: currentMonthBudgets.length
            };
        } catch (error) {
            console.error('Error getting user financial context:', error);
            return null;
        }
    }

    // Generate enhanced financial advice prompt
    generateFinancialPrompt(userMessage, financialContext) {
        const contextPrompt = financialContext ? `
Current Financial Context:
MONTHLY OVERVIEW:
- Income: RM${financialContext.monthlyIncome.toFixed(2)} (Last month: RM${financialContext.lastMonthIncome.toFixed(2)}, Change: ${financialContext.incomeChange.toFixed(1)}%)
- Expenses: RM${financialContext.monthlyExpenses.toFixed(2)} (Last month: RM${financialContext.lastMonthExpenses.toFixed(2)}, Change: ${financialContext.expenseChange.toFixed(1)}%)
- Net Income: RM${financialContext.netIncome.toFixed(2)}
- 3-Month Avg Income: RM${financialContext.avg3MonthIncome.toFixed(2)}
- 3-Month Avg Expenses: RM${financialContext.avg3MonthExpenses.toFixed(2)}

FINANCIAL HEALTH:
- Savings Rate: ${financialContext.savingsRate.toFixed(1)}%
- Cash Flow: ${financialContext.hasPositiveCashFlow ? 'Positive' : 'Negative'}

SPENDING ANALYSIS:
- Top Expense Categories: ${financialContext.topExpenseCategories.map(([cat, amt]) => `${cat} (RM${amt.toFixed(2)})`).join(', ')}
- Total Expense Categories: ${financialContext.totalExpenseCategories}

BUDGET TRACKING:
- Total Budget: RM${financialContext.totalBudget.toFixed(2)}
- Budget Spent: RM${financialContext.totalBudgetSpent.toFixed(2)}
- Budget Remaining: RM${financialContext.budgetRemaining.toFixed(2)}
- Budget Utilization: ${financialContext.budgetUtilizationRate.toFixed(1)}%
- Over-Budget Categories: ${financialContext.overBudgetCategoriesCount}

PLANNED PAYMENTS:
- Overdue: ${financialContext.overduePaymentsCount} payments (Total: RM${financialContext.totalOverdueAmount.toFixed(2)})
- Upcoming: ${financialContext.upcomingPaymentsCount} payments (Total: RM${financialContext.totalUpcomingAmount.toFixed(2)})

RETIREMENT PLANNING:
- Has Plan: ${financialContext.hasRetirementPlan ? 'Yes' : 'No'}${financialContext.retirementPlanDetails ? `
- Years to Retirement: ${financialContext.retirementPlanDetails.yearsToRetirement}
- Monthly EPF Contribution: RM${financialContext.retirementPlanDetails.monthlyEpfContribution?.toFixed(2) || '0.00'}
- Additional Monthly Savings Needed: RM${financialContext.retirementPlanDetails.additionalSavingsRequired?.toFixed(2) || '0.00'}` : ''}

DATA SUMMARY:
- Recent Transactions: ${financialContext.recentTransactionsCount}
- Active Budgets: ${financialContext.budgetsCount}
- Planned Payments: ${financialContext.plannedPaymentsCount}
        ` : '';

        return `You are Duitku AI, a professional, helpful, and intelligent financial advisor assistant for the Duitku financial management app. 

You help users with:
- Personal financial analysis and insights
- Budgeting strategies and optimization
- Savings and investment recommendations
- Retirement planning guidance
- Expense tracking and categorization tips
- Debt management and payment strategies
- Financial goal setting and achievement
- Cash flow analysis and improvement

${contextPrompt}

User Question: ${userMessage}

ANALYSIS GUIDELINES:
- Provide specific, actionable financial advice based on their actual data
- Identify spending patterns, trends, and potential areas for improvement
- Reference their actual numbers when giving recommendations
- Highlight any concerning financial patterns (overspending, negative cash flow, etc.)
- Suggest practical steps to improve their financial situation
- Be encouraging but realistic about their financial health
- If they have budget overruns, explain the impact and suggest solutions
- For retirement planning, provide specific guidance based on their current savings rate

Keep responses detailed but well-structured. Always encourage responsible financial habits and data-driven decision making.
Always assume the currency of the user is MYR and time zone is Malaysia (MYT/UTC+8).
Unless the user asks questions related to finance, only reply with "I am merely an AI assistant and I can only help with financial matters. Please ask me about your financial situation or anything related to finance."
If you don't have their specific financial data, provide general advice and suggest they use the app's features to enable more personalized analysis.`;
    }

    // Get or create active conversation for user
    async getOrCreateConversation(userId) {
        try {
            // Find active (non-archived) conversation
            let conversation = await Conversation.findOne({ 
                user: userId, 
                isArchived: false 
            });
            
            if (!conversation) {
                // Create new conversation with welcome message
                conversation = new Conversation({
                    user: userId,
                    isArchived: false,
                    conversationTitle: 'Financial Chat',
                    messages: [{
                        id: '1',
                        type: 'ai',
                        content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
                        timestamp: new Date()
                    }]
                });
                await conversation.save();
            }
            
            return conversation;
        } catch (error) {
            console.error('Error getting/creating conversation:', error);
            return null;
        }
    }

    // Save message to conversation
    async saveMessageToConversation(userId, messageData) {
        try {
            const conversation = await this.getOrCreateConversation(userId);
            if (conversation) {
                conversation.messages.push(messageData);
                await conversation.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving message to conversation:', error);
            return false;
        }
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

            // Create user message object
            const userMessage = {
                id: Date.now().toString(),
                type: 'user',
                content: message.trim(),
                timestamp: new Date()
            };

            // Save user message to conversation
            await this.saveMessageToConversation(userId, userMessage);

            // Get user's financial context
            const financialContext = await this.getUserFinancialContext(userId);

            // Generate AI response
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const prompt = this.generateFinancialPrompt(message, financialContext);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiMessage = response.text();

            // Create AI message object
            const aiMessageData = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: aiMessage,
                timestamp: new Date()
            };

            // Save AI message to conversation
            await this.saveMessageToConversation(userId, aiMessageData);

            res.json({
                success: true,
                message: aiMessage,
                timestamp: aiMessageData.timestamp.toISOString()
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

    // Get conversation history
    async getConversationHistory(req, res) {
        try {
            const userId = req.user._id;
            const conversation = await this.getOrCreateConversation(userId);
            
            if (conversation) {
                // Convert mongoose messages to plain objects with proper timestamps
                const messages = conversation.messages.map(msg => ({
                    id: msg.id,
                    type: msg.type,
                    content: msg.content,
                    timestamp: msg.timestamp.toISOString(),
                    isError: msg.isError || false
                }));

                res.json({
                    success: true,
                    messages: messages,
                    lastUpdated: conversation.lastUpdated.toISOString()
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve conversation history'
                });
            }
        } catch (error) {
            console.error('Error getting conversation history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversation history'
            });
        }
    }

    // Clear conversation history (delete everything)
    async clearConversation(req, res) {
        try {
            const userId = req.user._id;
            
            // Delete all conversations (active and archived)
            await Conversation.deleteMany({ user: userId });
            
            // Create new conversation with welcome message
            const newConversation = new Conversation({
                user: userId,
                isArchived: false,
                conversationTitle: 'Financial Chat',
                messages: [{
                    id: '1',
                    type: 'ai',
                    content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
                    timestamp: new Date()
                }]
            });
            
            await newConversation.save();
            
            res.json({
                success: true,
                message: 'All conversations cleared successfully',
                messages: [{
                    id: '1',
                    type: 'ai',
                    content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
                    timestamp: newConversation.messages[0].timestamp.toISOString()
                }]
            });
        } catch (error) {
            console.error('Error clearing conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clear conversation'
            });
        }
    }

    // Start new chat (archive current conversation)
    async startNewChat(req, res) {
        try {
            const userId = req.user._id;
            
            // Find current active conversation
            const currentConversation = await Conversation.findOne({ 
                user: userId, 
                isArchived: false 
            });
            
            if (currentConversation && currentConversation.messages.length > 1) {
                // Archive current conversation (only if it has more than just welcome message)
                
                // First, check if there's already an archived conversation and remove it
                // (keep only one previous chat as per requirement)
                await Conversation.findOneAndDelete({ 
                    user: userId, 
                    isArchived: true 
                });
                
                // Archive current conversation
                currentConversation.isArchived = true;
                currentConversation.archivedAt = new Date();
                currentConversation.conversationTitle = `Chat from ${new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}`;
                await currentConversation.save();
            } else if (currentConversation) {
                // If current conversation only has welcome message, just delete it
                await Conversation.findByIdAndDelete(currentConversation._id);
            }
            
            // Create new conversation with welcome message
            const newConversation = new Conversation({
                user: userId,
                isArchived: false,
                conversationTitle: 'Financial Chat',
                messages: [{
                    id: '1',
                    type: 'ai',
                    content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
                    timestamp: new Date()
                }]
            });
            
            await newConversation.save();
            
            res.json({
                success: true,
                message: 'New chat started successfully',
                messages: [{
                    id: '1',
                    type: 'ai',
                    content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
                    timestamp: newConversation.messages[0].timestamp.toISOString()
                }]
            });
        } catch (error) {
            console.error('Error starting new chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start new chat'
            });
        }
    }

    // Get archived conversation (read-only)
    async getArchivedConversation(req, res) {
        try {
            const userId = req.user._id;
            const archivedConversation = await Conversation.findOne({ 
                user: userId, 
                isArchived: true 
            });
            
            if (archivedConversation) {
                const messages = archivedConversation.messages.map(msg => ({
                    id: msg.id,
                    type: msg.type,
                    content: msg.content,
                    timestamp: msg.timestamp.toISOString(),
                    isError: msg.isError || false
                }));

                res.json({
                    success: true,
                    conversation: {
                        title: archivedConversation.conversationTitle,
                        archivedAt: archivedConversation.archivedAt.toISOString(),
                        messages: messages
                    }
                });
            } else {
                res.json({
                    success: true,
                    conversation: null
                });
            }
        } catch (error) {
            console.error('Error getting archived conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get archived conversation'
            });
        }
    }
}

export default ChatbotController;