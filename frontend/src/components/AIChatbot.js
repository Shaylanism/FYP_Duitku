import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AIChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [archivedConversation, setArchivedConversation] = useState(null);
  const [showArchivedChat, setShowArchivedChat] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const STORAGE_KEY = `duitku_chat_${user?.id || 'default'}`;

  // Format text with bold syntax (**text**)
  const formatMessageContent = (content) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Save messages to localStorage for immediate persistence
  const saveToLocalStorage = (messages) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages to localStorage:', error);
    }
  };

  // Load messages from localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error);
      return null;
    }
  };

  // Load conversation history from backend
  const loadConversationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const [historyResponse, archivedResponse] = await Promise.all([
        axios.get('/api/chatbot/history'),
        axios.get('/api/chatbot/archived')
      ]);

      if (historyResponse.data.success) {
        setMessages(historyResponse.data.messages);
        saveToLocalStorage(historyResponse.data.messages);
      } else {
        // Fallback to localStorage if backend fails
        const localMessages = loadFromLocalStorage();
        if (localMessages) {
          setMessages(localMessages);
        } else {
          // Default welcome message
          setMessages([{
            id: '1',
            type: 'ai',
            content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
            timestamp: new Date().toISOString()
          }]);
        }
      }

      // Load archived conversation if available
      if (archivedResponse.data.success && archivedResponse.data.conversation) {
        setArchivedConversation(archivedResponse.data.conversation);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Fallback to localStorage
      const localMessages = loadFromLocalStorage();
      if (localMessages) {
        setMessages(localMessages);
      } else {
        // Default welcome message
        setMessages([{
          id: '1',
          type: 'ai',
          content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
          timestamp: new Date().toISOString()
        }]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load conversation history on component mount
  useEffect(() => {
    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && !isLoadingHistory) {
      saveToLocalStorage(messages);
    }
  }, [messages, isLoadingHistory]);

  // Handle logout event to clear conversations
  useEffect(() => {
    const handleLogout = () => {
      // Clear localStorage
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear localStorage on logout:', error);
      }
      // Reset messages to default
      setMessages([{
        id: '1',
        type: 'ai',
        content: "Hello! I'm Duitku AI, your personal financial advisor. I can help you with budgeting, savings recommendations, financial planning, and answer questions about your account. How can I assist you today?",
        timestamp: new Date().toISOString()
      }]);
    };

    window.addEventListener('userLoggedOut', handleLogout);
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, [STORAGE_KEY]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoadingHistory) {
      inputRef.current?.focus();
    }
  }, [isLoadingHistory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/chatbot/chat', {
        message: userMessage.content
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.message,
          timestamp: response.data.timestamp
        };
        const updatedMessagesWithAI = [...updatedMessagesWithUser, aiMessage];
        setMessages(updatedMessagesWithAI);
      } else {
        throw new Error(response.data.message || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err.response?.data?.message || 'Sorry, I encountered an error. Please try again.';
      setError(errorMessage);
      
      // Add error message to chat
      const errorAiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/chatbot/clear');
      
      if (response.data.success) {
        setMessages(response.data.messages);
        saveToLocalStorage(response.data.messages);
        setArchivedConversation(null); // Clear archived conversation too
        setShowArchivedChat(false);
        setError('');
      } else {
        throw new Error(response.data.message || 'Failed to clear conversation');
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
      // Fallback to local clear
      const defaultMessage = {
        id: '1',
        type: 'ai',
        content: "Hello! I'm Duitku AI, your personal financial advisor. How can I assist you today?",
        timestamp: new Date().toISOString()
      };
      setMessages([defaultMessage]);
      saveToLocalStorage([defaultMessage]);
      setError('Failed to sync with server, but chat has been cleared locally.');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/chatbot/start-new');
      
      if (response.data.success) {
        setMessages(response.data.messages);
        saveToLocalStorage(response.data.messages);
        setShowArchivedChat(false);
        setError('');
        
        // Reload archived conversation
        try {
          const archivedResponse = await axios.get('/api/chatbot/archived');
          if (archivedResponse.data.success && archivedResponse.data.conversation) {
            setArchivedConversation(archivedResponse.data.conversation);
          }
        } catch (archivedError) {
          console.error('Failed to load archived conversation:', archivedError);
        }
      } else {
        throw new Error(response.data.message || 'Failed to start new chat');
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
      setError('Failed to start new chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArchivedChat = () => {
    setShowArchivedChat(!showArchivedChat);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const suggestedQuestions = [
    "Based on my income and expenses, how much should I save each month?",
    "How can I improve my budget allocation?",
    "What's my current financial health status?",
    "Give me tips for reducing my monthly expenses",
    "How much should I allocate for retirement planning?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  return (
    <div className="h-full bg-white rounded-xl shadow-soft border border-neutral-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              {showArchivedChat ? `Previous Chat` : 'Duitku AI Assistant'}
            </h2>
            <p className="text-sm text-neutral-600">
              {showArchivedChat 
                ? `${archivedConversation?.title} - Read Only`
                : 'Your Personal Financial Advisor'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Show Previous Chat Button */}
          {archivedConversation && !showArchivedChat && (
            <button
              onClick={toggleArchivedChat}
              disabled={isLoading || isLoadingHistory}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="View Previous Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          {/* Back to Current Chat Button */}
          {showArchivedChat && (
            <button
              onClick={toggleArchivedChat}
              disabled={isLoading || isLoadingHistory}
              className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Back to Current Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </button>
          )}

          {/* Start New Chat Button */}
          {!showArchivedChat && (
            <button
              onClick={startNewChat}
              disabled={isLoading || isLoadingHistory}
              className="p-2 rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Start New Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}

          {/* Clear All Chats Button */}
          {!showArchivedChat && (
            <button
              onClick={clearChat}
              disabled={isLoading || isLoadingHistory}
              className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear All Chats"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{maxHeight: 'calc(100vh - 300px)'}}>
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-32">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        ) : (
          (showArchivedChat ? archivedConversation?.messages || [] : messages).map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? showArchivedChat 
                      ? 'bg-neutral-400 text-white' // Archived user messages in gray
                      : 'bg-primary-500 text-white'
                    : message.isError
                    ? 'bg-error-50 text-error-700 border border-error-200'
                    : showArchivedChat
                    ? 'bg-neutral-50 text-neutral-800 border border-neutral-200' // Archived AI messages
                    : 'bg-neutral-100 text-neutral-800'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{formatMessageContent(message.content)}</p>
              </div>
              <p className={`text-xs text-neutral-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                {formatTimestamp(message.timestamp)}
              </p>
            </div>
            {message.type === 'ai' && (
              <div className={`flex-shrink-0 h-8 w-8 ${
                showArchivedChat 
                  ? 'bg-gradient-to-r from-neutral-400 to-neutral-500' 
                  : 'bg-gradient-to-r from-primary-500 to-primary-600'
              } rounded-full flex items-center justify-center mr-3 order-0`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
          </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-neutral-100 px-4 py-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (only show when chat is empty or just has welcome message and not viewing archived) */}
      {!isLoadingHistory && !showArchivedChat && messages.length <= 1 && (
        <div className="px-6 py-4 border-t border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Suggested Questions:</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="text-xs px-3 py-2 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors duration-200 border border-primary-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Archived Chat Notice */}
      {showArchivedChat && (
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <div className="flex items-center space-x-2 text-neutral-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">This is a read-only archived conversation. Use "Back to Current Chat" to resume active chatting.</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      {!showArchivedChat && (
        <div className="p-6 border-t border-neutral-200">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your finances..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows="1"
                style={{minHeight: '48px', maxHeight: '120px'}}
                disabled={isLoading || isLoadingHistory}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || isLoadingHistory}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          {error && (
            <p className="text-sm text-error-600 mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIChatbot;