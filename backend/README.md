# Backend - MVC Architecture

This backend follows the **Model-View-Controller (MVC)** architectural pattern for better code organization and maintainability.

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── controllers/             # Controller layer - Business logic
│   ├── AuthController.js    # Authentication business logic
│   └── UserController.js    # User management business logic
├── middleware/              # Express middleware
│   └── auth.js             # Authentication middleware
├── models/                  # Model layer - Data models
│   └── User.js             # User data model with Mongoose schema
├── routes/                  # Route layer - API endpoints (thin routes)
│   ├── authRoutes.js       # Authentication routes
│   └── userRoutes.js       # User management routes
├── server.js               # Express server configuration
└── startServer.bat         # Windows batch file to start server
```

## MVC Architecture Breakdown

### 📊 **Models** (`/models`)
- **Purpose**: Define data structure and database operations
- **Responsibilities**:
  - Database schema definition
  - Data validation
  - Database operations (save, find, update, delete)
  - Business logic related to data (e.g., password hashing)

### 🎮 **Controllers** (`/controllers`)
- **Purpose**: Handle business logic and coordinate between models and routes
- **Responsibilities**:
  - Process request data
  - Validate input
  - Interact with models
  - Format responses
  - Handle errors

### 🛣️ **Routes** (`/routes`)
- **Purpose**: Define API endpoints and delegate to controllers
- **Responsibilities**:
  - Define HTTP routes (GET, POST, PUT, DELETE)
  - Apply middleware
  - Delegate to appropriate controller methods
  - Keep routes thin and focused

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login  
- `GET /verify` - Token verification

### User Management Routes (`/api/users`)
- `GET /` - Get all users
- `POST /` - Create new user (admin)
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

## Benefits of This Structure

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Maintainability**: Easy to locate and modify specific functionality
3. **Scalability**: Easy to add new features without affecting existing code
4. **Testability**: Each layer can be tested independently
5. **Reusability**: Controllers can be reused across different routes
6. **Code Organization**: Clear structure makes the codebase easier to understand

## How to Run

1. Install dependencies: `npm install`
2. Set up environment variables (create `.env` file with `MONGO_URI` and `JWT_SECRET`)
3. Start the server: `npm run dev` or run `startServer.bat` 