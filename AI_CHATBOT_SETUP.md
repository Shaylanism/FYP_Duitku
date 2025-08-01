# AI Chatbot Feature - Setup Instructions

## Overview
The AI Chatbot feature has been successfully integrated into your Duitku financial management app using Google's Gemini 2.0 Flash API. The chatbot provides personalized financial advice based on user data and general financial guidance.

## Features
- **Personalized Financial Advice**: The AI accesses user's transaction history, budgets, planned payments, and retirement plans to provide tailored recommendations
- **General Financial Education**: Answers questions about budgeting, saving, investing, and financial planning
- **Real-time User Data Integration**: Provides insights based on current income, expenses, budget allocation, and financial goals
- **Interactive Chat Interface**: Clean, user-friendly chat interface with suggested questions and real-time responses

## Setup Instructions

### 1. Get Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" and create a new API key
4. Copy the API key

### 2. Configure Environment Variables
Create a `.env` file in the **root directory** (same level as package.json, not in the backend folder) and add:

```env
# Google Gemini AI Configuration
GEMINI_API_KEY=your_actual_api_key_here

# Your existing environment variables...
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/duitku
```

**Important**: The `.env` file must be in the root directory of your project, not in the `backend/` folder.

### 3. Start the Application
The feature is now ready to use! Start your application as usual:

```bash
# Start backend (from root directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

## How It Works

### Backend Architecture (MVC Pattern)
- **Controller**: `backend/controllers/ChatbotController.js` - Handles AI conversations and user data integration
- **Routes**: `backend/routes/chatbotRoutes.js` - Defines API endpoints
- **Integration**: Added to `backend/server.js` at `/api/chatbot`

### Frontend Components
- **Component**: `frontend/src/components/AIChatbot.js` - Interactive chat interface
- **Navigation**: Added "AI Assistant" to sidebar navigation
- **Routing**: Available at `/dashboard/ai-chatbot`

### Data Integration
The chatbot analyzes:
- Monthly income and expenses
- Budget allocation and spending
- Overdue payments
- Retirement planning status
- Recent transaction patterns

## API Endpoints

### POST `/api/chatbot/chat`
Send a message to the AI chatbot
```json
{
  "message": "Based on my income, how much should I save?"
}
```

### GET `/api/chatbot/history`
Get conversation history (placeholder for future enhancement)

## Security & Privacy
- All requests require authentication via JWT token
- User data is processed securely and not stored by the AI service
- Financial context is generated on-demand for each request

## Usage Examples

### Sample Questions Users Can Ask:
- "Based on my income and expenses, how much should I save each month?"
- "How can I improve my budget allocation?"
- "What's my current financial health status?"
- "Give me tips for reducing my monthly expenses"
- "How much should I allocate for retirement planning?"

### AI Responses Include:
- Personalized advice based on actual financial data
- General financial education and best practices
- Specific recommendations for budget optimization
- Savings and investment guidance

## Troubleshooting

### Common Issues:
1. **"AI service is not configured"** - Check that:
   - GEMINI_API_KEY is set in your `.env` file
   - The `.env` file is in the **root directory** (not in backend/ folder)
   - The API key is valid and active
2. **"AI service temporarily unavailable"** - API quota exceeded, try again later
3. **Chat not loading** - Ensure backend is running and API endpoints are accessible

### Debug Steps:
1. Check backend console for environment variable status messages:
   - ✅ "GEMINI_API_KEY loaded successfully" appears when first chat message is sent
   - ⚠️ Warning messages indicate the key wasn't found
2. Test the health endpoint: `GET /api/chatbot/health` to verify:
   - `apiKeyConfigured: true` - Environment variable is set
   - `aiServiceInitialized: true` - AI service can be created successfully
3. Verify API key is valid and has quota available at [Google AI Studio](https://aistudio.google.com/)
4. Ensure `.env` file is in the correct location (root directory)
5. Test API endpoints directly using Postman or similar tool

## Future Enhancements
- Conversation history storage
- Export chat conversations
- Integration with financial goal tracking
- Advanced financial analysis and predictions
- Multi-language support

## Files Modified/Created

### Backend Files:
- ✅ `backend/controllers/ChatbotController.js` (new)
- ✅ `backend/routes/chatbotRoutes.js` (new)
- ✅ `backend/server.js` (modified - added chatbot routes)
- ✅ `package.json` (modified - added @google/generative-ai dependency)

### Frontend Files:
- ✅ `frontend/src/components/AIChatbot.js` (new)
- ✅ `frontend/src/components/Layout.js` (modified - added navigation item)
- ✅ `frontend/src/App.js` (modified - added route)

All existing functionality remains intact and working as before!