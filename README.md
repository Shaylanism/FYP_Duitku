## FYP_Duitku - Web-based Financial Management Application

A full-stack web application built following the **MERN stack** using an **MVC architectural pattern** for comprehensive personal financial management including transactions, budgeting, planned payments, retirement planning, and AI-powered financial assistance.

## Architecture

This project follows the **Model-View-Controller (MVC)** architectural pattern for better code organization and maintainability.

## Project Structure

```
FYP_Duitku/
├── backend/                    # Backend API (Node.js + Express)
│   ├── config/                 # Configuration files
│   │   └── database.js         # MongoDB connection
│   ├── constants/              # Application constants
│   │   ├── categories.js       # Transaction categories
│   │   ├── responses.js        # Standard API responses
│   │   └── validation.js       # Validation constants
│   ├── controllers/            # Controllers - Business logic
│   │   ├── AuthController.js   # Authentication logic
│   │   ├── BudgetController.js # Budget management logic
│   │   ├── ChatbotController.js # AI chatbot logic
│   │   ├── PlannedPaymentController.js # Planned payment logic
│   │   ├── RetirementPlanController.js # Retirement planning logic
│   │   ├── TransactionController.js # Transaction management logic
│   │   └── TransactionHistoryController.js # Transaction history logic
│   ├── middleware/             # Express middleware
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── errorHandler.js    # Error handling middleware
│   ├── models/                 # Models - Data layer
│   │   ├── Budget.js          # Budget model with Mongoose
│   │   ├── Conversation.js    # AI conversation model
│   │   ├── PlannedPayment.js  # Planned payment model
│   │   ├── RetirementPlan.js  # Retirement plan model
│   │   ├── Transaction.js     # Transaction model with Mongoose
│   │   ├── TransactionHistory.js # Transaction history model
│   │   └── User.js            # User model with Mongoose
│   ├── routes/                 # Routes - API endpoints
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── budgetRoutes.js    # Budget management routes
│   │   ├── chatbotRoutes.js   # AI chatbot routes
│   │   ├── plannedPaymentRoutes.js # Planned payment routes
│   │   ├── retirementRoutes.js # Retirement planning routes
│   │   ├── transactionHistoryRoutes.js # Transaction history routes
│   │   └── transactionRoutes.js # Transaction routes
│   ├── services/              # Business services
│   │   └── TransactionService.js # Transaction business logic
│   ├── utils/                 # Utility functions
│   │   ├── dateUtils.js       # Date manipulation utilities
│   │   ├── helpers.js         # General helper functions
│   │   └── reminderSystem.js  # Payment reminder system
│   ├── validators/            # Input validation
│   │   ├── authValidator.js   # Authentication validation
│   │   ├── budgetValidator.js # Budget validation
│   │   ├── plannedPaymentValidator.js # Planned payment validation
│   │   └── transactionValidator.js # Transaction validation
│   ├── server.js              # Express server setup
│   ├── package.json           # Backend dependencies
│   └── startServer.bat        # Windows start script
├── frontend/                   # Views - React frontend
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AIChatbot.js   # AI chatbot component
│   │   │   ├── BudgetPlanner.js # Budget planning component
│   │   │   ├── Layout.js      # Main layout component
│   │   │   ├── Login.js       # Login component
│   │   │   ├── PlannedPayments.js # Planned payments component
│   │   │   ├── Register.js    # Registration component
│   │   │   ├── RetirementPlanner.js # Retirement planning component
│   │   │   └── [various modal components] # Modal components
│   │   ├── contexts/          # React context (state management)
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── services/          # Frontend services
│   │   │   ├── apiService.js  # API communication
│   │   │   ├── authService.js # Authentication service
│   │   │   └── transactionService.js # Transaction service
│   │   ├── utils/             # Frontend utilities
│   │   │   ├── formatters.js  # Data formatting utilities
│   │   │   ├── monthUtils.js  # Month manipulation utilities
│   │   │   └── pdfUtils.js    # PDF generation utilities
│   │   ├── validators/        # Frontend validation
│   │   │   └── transactionValidator.js # Transaction validation
│   │   └── TransactionDashboard.js # Main transaction dashboard component
│   ├── package.json           # Frontend dependencies
│   ├── startClient.bat        # Windows start script
│   └── vite.config.js         # Vite configuration
├── package.json               # Root project configuration
└── README.md
```

## Features

- **User Authentication** (Register, Login, JWT tokens, Token verification)
- **Transaction Management** (Income/Expense tracking with full CRUD operations)
- **Financial Summary** (Total Income, Expenses, and Monthly Balance calculation)
- **Transaction Categories** (Organize transactions by predefined categories)
- **Budget Planning** (Monthly budget setting and tracking with category-wise budgets)
- **Budget vs Actual Comparison** (Visual indicators for budget performance)
- **Month-wise Budget Management** (Past months view-only, current month editable)
- **Budget Copy Functionality** (Copy budgets from previous months)
- **Budget Impact Analysis** (Check transaction impact on budgets before creation)
- **Planned Payments** (Recurring bill and payment management with due date tracking)
- **Payment Reminders** (3-day and 1-day reminder system with notifications)
- **Payment Settlement** (Mark payments as settled with automatic transaction creation)
- **Smart Notifications** (Login popup for unsettled payments with navigation warnings)
- **Transaction History** (Comprehensive transaction history with pagination and filtering)
- **Retirement Planning** (Calculate retirement savings requirements and projections)
- **AI-Powered Financial Assistant** (Chatbot for financial advice and guidance using Google Gemini AI)
- **Conversation Management** (Chat history, conversation archiving, and new chat functionality)
- **Financial Report Export** (PDF generation for financial reports)
- **Real-time Budget Monitoring** (Live budget exceedance warnings and notifications)
- **Protected Routes** (JWT-based authentication middleware)
- **Responsive UI** (Modern React frontend with Tailwind CSS styling)
- **MVC Architecture** (Clean code organization and separation of concerns)

## Technologies Used

### Backend
- Node.js
- Express.js (RESTful API Framework)
- MongoDB + Mongoose (Database and Object Document Mapping)
- JWT (JSON Web Tokens for authentication)
- bcryptjs (Password hashing and salt generation)
- Google Gemini AI (AI chatbot integration)
- dotenv (Environment variable management)
- CORS (Cross-origin resource sharing)

### Frontend
- React.js (UI framework)
- Vite (Build tool and development server)
- React Router (Client-side routing)
- Context API (State management)
- Axios (HTTP client for API calls)
- Tailwind CSS (Utility-first CSS framework)
- jsPDF (PDF generation for reports)
- PostCSS (CSS processing)

## Installation & Setup

### Prerequisites
- Node.js - Install from the official website (https://nodejs.org/en)
- MongoDB Compass (Optional since Cloud DB) - GUI to view and manipulate project database - Install from official website (https://www.mongodb.com/products/tools/compass)

================================================================================

### Backend Setup (Must set this up before the frontend!)

# Navigate to backend directory
After downloading the required prerequisites, copy the FYP_Duitku file path, open CMD as admin, type 'cd' and paste the file path.

# Install backend dependencies
Type 'cd backend' to access the backend folder, type 'npm install' and wait for the download to complete.

# Start the server
Double-click the startServer.bat file in the backend folder to start the server.

# How to know if the server has successfully started before proceeding to frontend setup:
You should see this response from the commander terminal - "Connected to MongoDB: ac-jdyokfs-shard-00-02.fc2e0ni.mongodb.net"

================================================================================

### Frontend Setup (Backend must be setup first!)

# Navigate to frontend directory
After starting the server, type 'cd ..\ to return to the root FYP_Duitku folder.

# Install frontend dependencies
Type 'cd frontend' to access the frontend folder, type 'npm install' and wait for the download to complete.

# Start the frontend
Double-click the startClient.bat file in the backend folder to start the server.

# How to know if the server has successfully started before proceeding to frontend setup:
A page should automatically open once the steps are followed and the startClient batch file is double-clicked.

=================================================================================

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Transaction Management (Protected)
- `GET /api/transactions` - Get user's transactions with financial summary
- `POST /api/transactions` - Create new transaction (income/expense)
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/categories` - Get available transaction categories
- `GET /api/transactions/check-budget` - Check budget impact for transaction

### Budget Management (Protected)
- `GET /api/budgets` - Get user's budgets
- `POST /api/budgets` - Create new budget
- `GET /api/budgets/:id` - Get specific budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/with-spending` - Get budgets with actual spending data
- `POST /api/budgets/copy` - Copy budgets from previous month
- `GET /api/budgets/check-impact` - Check transaction impact on budgets
- `GET /api/budgets/check-exceedance` - Check for budget exceedance

### Planned Payments (Protected)
- `GET /api/planned-payments` - Get user's planned payments
- `POST /api/planned-payments` - Create new planned payment
- `GET /api/planned-payments/:id` - Get specific planned payment
- `PUT /api/planned-payments/:id` - Update planned payment
- `DELETE /api/planned-payments/:id` - Delete planned payment
- `PUT /api/planned-payments/:id/settle` - Mark payment as settled
- `GET /api/planned-payments/notifications` - Get payment notifications
- `GET /api/planned-payments/reminders` - Get payments due for reminders

### Transaction History (Protected)
- `GET /api/transaction-history` - Get transaction history with pagination and filters
- `GET /api/transaction-history/categories` - Get available categories for filtering
- `GET /api/transaction-history/transaction/:transactionId` - Get history for specific transaction

### Retirement Planning (Protected)
- `POST /api/retirement/calculate` - Calculate retirement plan
- `GET /api/retirement` - Get user's retirement plan
- `DELETE /api/retirement` - Delete retirement plan

### AI Chatbot (Protected)
- `POST /api/chatbot/chat` - Send message to AI chatbot
- `GET /api/chatbot/history` - Get conversation history
- `POST /api/chatbot/clear` - Clear conversation history
- `POST /api/chatbot/start-new` - Start new chat (archive current)
- `GET /api/chatbot/archived` - Get archived conversation
- `GET /api/chatbot/health` - Health check for AI service

## Usage

1. Start the backend server (http://localhost:5000)
2. Start the frontend application (http://localhost:3000)
3. Register a new account or login with existing credentials
4. Use the sidebar navigation to access different features:

### **Transaction Dashboard**
   - View your comprehensive financial summary (Income, Expenses, Balance)
   - Add new transactions (income or expense) with category selection
   - Edit existing transactions with validation
   - Delete transactions with confirmation
   - Organize transactions by predefined categories
   - Real-time balance calculations and financial insights

### **Budget Planner**
   - Set monthly budgets by category with amount limits
   - Compare actual spending vs budgets with visual indicators
   - View budget status indicators (On Track, Warning, Over Budget)
   - Copy budgets from previous months for convenience
   - Filter budgets by month (past months are view-only)
   - Real-time budget impact warnings when creating transactions
   - Budget exceedance notifications and alerts

### **Planned Payments**
   - Set up recurring monthly payments (bills, loans, subscriptions, rent)
   - Configure due dates, payment amounts, and descriptions
   - Automatic status tracking (Pending, Settled, Overdue)
   - Mark payments as settled to create transactions automatically
   - Enable/disable payment plans as needed
   - Smart reminder system (3 days and 1 day before due date)
   - **Login notification popup** for unsettled payments
   - **Warning indicators** in navigation for payments due within 3 days
   - Payment notifications and overdue alerts

### **Transaction History**
   - View comprehensive transaction history with pagination
   - Filter transactions by date range, category, and type
   - Search transactions by description or amount
   - Export transaction data for record-keeping
   - Detailed transaction analysis and insights

### **Retirement Planner**
   - Calculate retirement savings requirements based on current age and goals
   - Set target retirement age and desired monthly income
   - View projected savings needed and monthly contribution requirements
   - Analyze different retirement scenarios and plans
   - Save and update retirement planning data

### **AI Financial Assistant**
   - Chat with AI-powered financial advisor using Google Gemini AI
   - Get personalized financial advice and recommendations
   - Ask questions about budgeting, savings, and financial planning
   - Conversation history management and archiving
   - Start new conversations and clear chat history
   - AI health monitoring and service status checks

