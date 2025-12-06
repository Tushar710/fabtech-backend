const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['Employee', 'User', 'admin', 'employee']
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reaction: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ messageType: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
});

// Method to add reaction
messageSchema.methods.addReaction = function(userId, reaction) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => 
    r.userId.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    userId,
    reaction,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => 
    r.userId.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to edit message
messageSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.editedAt = new Date();
  
  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = 'This message was deleted';
  
  return this.save();
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = function(conversationId, page = 1, limit = 50) {
  return this.find({
    conversationId,
    isDeleted: false
  })
  .populate('senderId', 'teamMemberName name email role')
  .populate('replyTo', 'content senderId')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip((page - 1) * limit);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(conversationId, userId) {
  return this.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      status: { $ne: 'read' }
    },
    {
      status: 'read'
    }
  );
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function(conversationId, userId) {
  return this.countDocuments({
    conversationId,
    senderId: { $ne: userId },
    status: { $ne: 'read' },
    isDeleted: false
  });
};

// Pre-save middleware to update conversation's lastMessage
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Chat = mongoose.model('Chat');
      await Chat.findByIdAndUpdate(this.conversationId, {
        lastMessage: this._id,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating conversation lastMessage:', error);
    }
  }
  next();
});

// Pre-save middleware to increment unread count for other participants
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Chat = mongoose.model('Chat');
      const conversation = await Chat.findById(this.conversationId);
      
      if (conversation) {
        // Increment unread count for all participants except sender
        conversation.participants.forEach(participant => {
          if (participant.userId.toString() !== this.senderId.toString()) {
            participant.unreadCount = (participant.unreadCount || 0) + 1;
          }
        });
        
        await conversation.save();
      }
    } catch (error) {
      console.error('Error updating unread counts:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
