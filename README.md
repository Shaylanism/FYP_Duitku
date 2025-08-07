# FYP_Duitku - Personal Finance Tracker

A full-stack web application built with **MERN stack** following **MVC architectural pattern** for tracking personal income and expenses.

## 🏗️ Architecture

This project follows the **Model-View-Controller (MVC)** architectural pattern for better code organization, maintainability, and scalability.

## 📁 Project Structure

```
FYP_Duitku/
├── backend/                    # Backend API (Node.js + Express)
│   ├── config/                 # Configuration files
│   │   └── database.js         # MongoDB connection
│   ├── controllers/            # 🎮 Controllers - Business logic
│   │   ├── AuthController.js   # Authentication logic
│   │   ├── UserController.js   # User management logic
│   │   └── TransactionController.js # Transaction management logic
│   ├── middleware/             # Express middleware
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/                 # 📊 Models - Data layer
│   │   ├── User.js            # User model with Mongoose
│   │   └── Transaction.js     # Transaction model with Mongoose
│   ├── routes/                 # 🛣️ Routes - API endpoints
│   │   ├── authRoutes.js      # Auth routes (thin)
│   │   ├── userRoutes.js      # User routes (thin)
│   │   └── transactionRoutes.js # Transaction routes (thin)
│   ├── server.js              # Express server setup
│   ├── package.json           # Backend dependencies
│   └── startServer.bat        # Windows start script
├── frontend/                   # 👁️ Views - React frontend
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React context (state management)
│   │   └── TransactionDashboard.js # Main transaction dashboard component
│   └── package.json
├── package.json               # Root project configuration
└── README.md
```

## 🎯 MVC Pattern Implementation

### **Models** (Data Layer)
- **Location**: `backend/models/`
- **Purpose**: Define data structure and database operations
- **Example**: User model with schema validation, password hashing

### **Views** (Presentation Layer)  
- **Location**: `frontend/src/`
- **Purpose**: User interface and user interaction
- **Technology**: React.js with modern hooks and context

### **Controllers** (Business Logic Layer)
- **Location**: `backend/controllers/`
- **Purpose**: Handle business logic, process requests, coordinate between models and views
- **Example**: AuthController for login/register, TransactionController for transaction CRUD operations

## 🚀 Features

- **User Authentication** (Register, Login, JWT tokens)
- **Transaction Management** (Income/Expense tracking with CRUD operations)
- **Financial Summary** (Total Income, Expenses, and Balance calculation)
- **Transaction Categories** (Organize transactions by categories)
- **Budget Planning** (Monthly budget setting and tracking)
- **Budget vs Actual Comparison** (Visual indicators for budget performance)
- **Month-wise Budget Management** (Past months view-only, current month editable)
- **Budget Copy Functionality** (Copy budgets from previous months)
- **Planned Payments** (Recurring bill and payment management)
- **Payment Reminders** (3-day and 1-day reminder system)
- **Payment Settlement** (Mark payments as settled with automatic transaction creation)
- **Smart Notifications** (Login popup for unsettled payments with navigation warnings)
- **Protected Routes** (Authentication middleware)
- **Responsive UI** (React frontend with modern styling)
- **MVC Architecture** (Clean code organization)

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (JSON Web Tokens)
- bcryptjs (Password hashing)

### Frontend
- React.js
- React Router
- Context API
- Axios (HTTP client)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create .env file in root directory with:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key

# Start backend server
npm run dev
# OR
startServer.bat
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start React development server
npm start
# OR
startClient.bat
```

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

### User Management (Protected - Admin)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🎨 Benefits of MVC Architecture

1. **Separation of Concerns** - Each layer has specific responsibilities
2. **Maintainability** - Easy to locate and modify specific functionality
3. **Scalability** - Easy to add new features without affecting existing code
4. **Testability** - Each layer can be tested independently
5. **Code Organization** - Clear structure for better team collaboration

## 📝 Usage

1. Start the backend server (http://localhost:5000)
2. Start the frontend application (http://localhost:3000)
3. Register a new account or login with existing credentials
4. Use the sidebar navigation to access:

### 📊 **Transaction Dashboard**
   - View your financial summary (Income, Expenses, Balance)
   - Add new transactions (income or expense)
   - Edit existing transactions
   - Delete transactions
   - Organize transactions by categories

### 📋 **Budget Planner**
   - Set monthly budgets by category
   - Compare actual spending vs budgets
   - View budget status indicators (On Track, Warning, Over Budget)
   - Copy budgets from previous months
   - Filter budgets by month (past months are view-only)

### 🔔 **Planned Payments**
   - Set up recurring monthly payments (bills, loans, subscriptions)
   - Configure due dates and payment amounts
   - Automatic status tracking (Pending, Settled, Overdue)
   - Mark payments as settled to create transactions automatically
   - Enable/disable payment plans
   - Reminder system (3 days and 1 day before due date)
   - **Login notification popup** for unsettled payments
   - **Warning indicators** in navigation for payments due within 3 days

## 🤝 Contributing

This project follows MVC architectural principles. When contributing:
- Keep routes thin - delegate business logic to controllers
- Maintain separation of concerns between Models, Views, and Controllers
- Follow the established folder structure
- Ensure all functionality remains intact after changes
