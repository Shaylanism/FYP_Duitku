import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['user', 'ai']
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    isError: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [messageSchema],
    isArchived: {
        type: Boolean,
        default: false
    },
    conversationTitle: {
        type: String,
        default: 'Financial Chat'
    },
    archivedAt: {
        type: Date,
        default: null
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

// Update lastUpdated when messages are modified
conversationSchema.pre('save', function(next) {
    if (this.isModified('messages')) {
        this.lastUpdated = new Date();
    }
    next();
});

// Index for efficient user queries
conversationSchema.index({ user: 1, isArchived: 1, lastUpdated: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;