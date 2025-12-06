const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'participants.userType'
    },
    userType: {
      type: String,
      required: true,
      enum: ['Employee', 'User', 'admin', 'employee']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  chatType: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ createdBy: 1 });

// Virtual for participant count
chatSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to add participant
chatSchema.methods.addParticipant = function(userId, userType) {
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      userId,
      userType,
      joinedAt: new Date(),
      unreadCount: 0
    });
  }
  
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => 
    p.userId.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to increment unread count for specific user
chatSchema.methods.incrementUnreadCount = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.unreadCount = (participant.unreadCount || 0) + 1;
  }
  
  return this.save();
};

// Method to reset unread count for specific user
chatSchema.methods.resetUnreadCount = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.unreadCount = 0;
  }
  
  return this.save();
};

// Static method to find conversations for a user
chatSchema.statics.findUserConversations = function(userId) {
  return this.find({
    'participants.userId': userId,
    isActive: true
  })
  .populate('lastMessage')
  .populate('participants.userId', 'teamMemberName name email role')
  .sort({ updatedAt: -1 });
};

// Static method to find direct conversation between two users
chatSchema.statics.findDirectConversation = function(userId1, userId2) {
  return this.findOne({
    chatType: 'direct',
    'participants.userId': { $all: [userId1, userId2] },
    isActive: true
  });
};

module.exports = mongoose.model('Chat', chatSchema);
