# FYP_Duitku - User Management System

A full-stack web application built with **MERN stack** following **MVC architectural pattern**.

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
│   │   └── UserController.js   # User management logic
│   ├── middleware/             # Express middleware
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/                 # 📊 Models - Data layer
│   │   └── User.js            # User model with Mongoose
│   ├── routes/                 # 🛣️ Routes - API endpoints
│   │   ├── authRoutes.js      # Auth routes (thin)
│   │   └── userRoutes.js      # User routes (thin)
│   ├── server.js              # Express server setup
│   └── startServer.bat        # Windows start script
├── frontend/                   # 👁️ Views - React frontend
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React context (state management)
│   │   └── UserManagement.js  # Main user management component
│   └── package.json
├── package.json               # Backend dependencies
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
- **Example**: AuthController for login/register, UserController for CRUD operations

## 🚀 Features

- **User Authentication** (Register, Login, JWT tokens)
- **User Management** (CRUD operations)
- **Protected Routes** (Authentication middleware)
- **Responsive UI** (React frontend)
- **MVC Architecture** (Clean code organization)

## 🛠️ Technologies Used

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
# Install backend dependencies
npm install

# Create .env file with:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key

# Start backend server
npm run dev
# OR
cd backend && startServer.bat
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

### User Management (Protected)
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
4. Access the user management dashboard
5. Perform CRUD operations on users

## 🤝 Contributing

This project follows MVC architectural principles. When contributing:
- Keep routes thin - delegate business logic to controllers
- Maintain separation of concerns between Models, Views, and Controllers
- Follow the established folder structure
- Ensure all functionality remains intact after changes
