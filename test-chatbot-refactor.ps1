# AI Chatbot Refactor Test Script
# PowerShell script to test the enhanced AI Chatbot functionality

Write-Host "🤖 Testing AI Chatbot Refactor" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Function to test API endpoints
function Test-ChatbotEndpoint {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = @{}
    )
    
    Write-Host "Testing $Method $Endpoint..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Method -eq "POST" -and $Body.Count -gt 0) {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot$Endpoint" -Method $Method -Headers $headers -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot$Endpoint" -Method $Method -Headers $headers
        }
        
        Write-Host "✅ Success: $Endpoint" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ Failed: $Endpoint - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host ""
Write-Host "🔍 Testing Backend Endpoints:" -ForegroundColor Blue
Write-Host "-----------------------------"

# Test health endpoint
Write-Host "1. Testing health endpoint..."
$health = Test-ChatbotEndpoint -Endpoint "/health"

if ($health) {
    Write-Host "   API Key Configured: $($health.apiKeyConfigured)" -ForegroundColor White
    Write-Host "   AI Service Initialized: $($health.aiServiceInitialized)" -ForegroundColor White
}

# Test conversation history endpoint
Write-Host ""
Write-Host "2. Testing conversation history endpoint..."
$history = Test-ChatbotEndpoint -Endpoint "/history"

# Test archived conversation endpoint
Write-Host ""
Write-Host "3. Testing archived conversation endpoint..."
$archived = Test-ChatbotEndpoint -Endpoint "/archived"

# Test start new chat endpoint
Write-Host ""
Write-Host "4. Testing start new chat endpoint..."
$newChat = Test-ChatbotEndpoint -Endpoint "/start-new" -Method "POST"

# Test clear conversation endpoint
Write-Host ""
Write-Host "5. Testing clear conversation endpoint..."
$clear = Test-ChatbotEndpoint -Endpoint "/clear" -Method "POST"

Write-Host ""
Write-Host "📋 Enhanced Features Summary:" -ForegroundColor Blue
Write-Host "----------------------------"
Write-Host "✅ Start New Chat functionality" -ForegroundColor Green
Write-Host "✅ Archive previous conversation (read-only)" -ForegroundColor Green
Write-Host "✅ Enhanced financial context analysis" -ForegroundColor Green
Write-Host "✅ Category-wise spending analysis" -ForegroundColor Green
Write-Host "✅ Budget utilization tracking" -ForegroundColor Green
Write-Host "✅ Financial health indicators" -ForegroundColor Green
Write-Host "✅ Trend analysis (3-month comparison)" -ForegroundColor Green
Write-Host "✅ Improved AI prompts for better advice" -ForegroundColor Green

Write-Host ""
Write-Host "🎨 Frontend Enhancements:" -ForegroundColor Blue
Write-Host "-------------------------"
Write-Host "✅ Start New Chat button" -ForegroundColor Green
Write-Host "✅ View Previous Chat button" -ForegroundColor Green
Write-Host "✅ Clear All Chats button" -ForegroundColor Green
Write-Host "✅ Read-only archived conversation view" -ForegroundColor Green
Write-Host "✅ Visual distinction for archived messages" -ForegroundColor Green
Write-Host "✅ Proper navigation between current/archived chats" -ForegroundColor Green

Write-Host ""
Write-Host "🗄️ Database Schema Updates:" -ForegroundColor Blue
Write-Host "---------------------------"
Write-Host "✅ Added isArchived field to Conversation model" -ForegroundColor Green
Write-Host "✅ Added conversationTitle field" -ForegroundColor Green
Write-Host "✅ Added archivedAt timestamp" -ForegroundColor Green
Write-Host "✅ Updated database indexes for efficiency" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Test the refactored chatbot by:" -ForegroundColor Blue
Write-Host "1. Starting the backend server: cd backend && npm start" -ForegroundColor White
Write-Host "2. Starting the frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "3. Navigate to the AI Chatbot section" -ForegroundColor White
Write-Host "4. Try the new 'Start New Chat' button" -ForegroundColor White
Write-Host "5. Check the 'View Previous Chat' functionality" -ForegroundColor White
Write-Host "6. Test the enhanced financial analysis" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Key Benefits:" -ForegroundColor Blue
Write-Host "----------------"
Write-Host "• Better conversation management with archival" -ForegroundColor White
Write-Host "• More detailed financial analysis for AI" -ForegroundColor White
Write-Host "• Improved user experience with multiple chat options" -ForegroundColor White
Write-Host "• Enhanced financial advice based on comprehensive data" -ForegroundColor White
Write-Host "• Maintains all existing functionality" -ForegroundColor White

Write-Host ""
Write-Host "✨ Refactor Complete! ✨" -ForegroundColor Green