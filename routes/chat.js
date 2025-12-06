const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Employee = require('../models/Employee');
const { body, validationResult } = require('express-validator');

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversations = await Chat.find({
      'participants.userId': userId
    })
    .populate('participants.userId', 'teamMemberName name email')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // If no conversations found, return empty array (frontend will show mock data)
    if (!conversations || conversations.length === 0) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    res.json({
      success: true,
      conversations: conversations.map(conv => ({
        _id: conv._id,
        title: conv.title,
        participants: conv.participants.map(p => ({
          userId: p.userId._id,
          userType: p.userType,
          name: p.userId.teamMemberName || p.userId.name || 'Unknown User'
        })),
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content,
          timestamp: conv.lastMessage.timestamp,
          senderId: conv.lastMessage.senderId
        } : null,
        unreadCount: conv.unreadCount || 0,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    // Return empty array on error so frontend shows mock data
    res.json({
      success: true,
      conversations: []
    });
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Handle both ObjectId and string conversationId
    let query = {};
    if (mongoose.Types.ObjectId.isValid(conversationId)) {
      query.conversationId = conversationId;
    } else {
      // For demo purposes, return empty array for invalid ObjectIds
      return res.json({
        success: true,
        messages: []
      });
    }
    
    const messages = await Message.find(query)
      .populate('senderId', 'teamMemberName name email')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      messages: messages.reverse().map(msg => ({
        _id: msg._id,
        conversationId: msg.conversationId,
        content: msg.content,
        messageType: msg.messageType,
        senderId: msg.senderId?._id || msg.senderId,
        senderType: msg.senderType,
        senderName: msg.senderId?.teamMemberName || msg.senderId?.name || 'Unknown User',
        timestamp: msg.timestamp,
        status: msg.status
      }))
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// Send a message
router.post('/messages', [
  body('conversationId').notEmpty().withMessage('Conversation ID is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('senderId').notEmpty().withMessage('Sender ID is required'),
  body('senderType').isIn(['admin', 'employee']).withMessage('Valid sender type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { conversationId, content, messageType = 'text', senderId, senderType } = req.body;

    // For demo purposes, allow string IDs and create mock ObjectIds if needed
    let validConversationId = conversationId;
    let validSenderId = senderId;
    
    // If not valid ObjectId, create a mock one for demo
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      validConversationId = new mongoose.Types.ObjectId();
    }
    
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      validSenderId = new mongoose.Types.ObjectId();
    }

    const message = new Message({
      conversationId: validConversationId,
      content,
      messageType,
      senderId: validSenderId,
      senderType,
      timestamp: new Date(),
      status: 'sent'
    });

    await message.save();

    // Update conversation's last message (only if conversation exists)
    try {
      await Chat.findByIdAndUpdate(validConversationId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });
    } catch (error) {
      console.log('Conversation not found, skipping update:', error.message);
    }

    // Try to populate sender info
    let senderName = 'Unknown User';
    try {
      await message.populate('senderId', 'teamMemberName name email');
      senderName = message.senderId?.teamMemberName || message.senderId?.name || 'Unknown User';
    } catch (error) {
      console.log('Could not populate sender, using default name:', error.message);
    }

    res.json({
      success: true,
      message: {
        _id: message._id,
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType,
        senderId: message.senderId,
        senderType: message.senderType,
        senderName: senderName,
        timestamp: message.timestamp,
        status: message.status
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Create new conversation
router.post('/conversations', [
  body('participants').isArray().withMessage('Participants must be an array'),
  body('title').notEmpty().withMessage('Conversation title is required'),
  body('createdBy').notEmpty().withMessage('Creator ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { participants, title, createdBy } = req.body;

    // Check if conversation already exists between these participants
    const existingConversation = await Chat.findOne({
      $and: [
        { 'participants.userId': participants[0].userId },
        { 'participants.userId': participants[1].userId }
      ]
    });

    if (existingConversation) {
      return res.json({
        success: true,
        conversation: existingConversation,
        message: 'Conversation already exists'
      });
    }

    const conversation = new Chat({
      title,
      participants,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await conversation.save();
    await conversation.populate('participants.userId', 'teamMemberName name email');

    res.json({
      success: true,
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        participants: conversation.participants.map(p => ({
          userId: p.userId._id,
          userType: p.userType,
          name: p.userId.teamMemberName || p.userId.name || 'Unknown User'
        })),
        lastMessage: null,
        unreadCount: 0,
        createdAt: conversation.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error.message
    });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    // Mark all messages in this conversation as read for this user
    await Message.updateMany(
      { 
        conversationId, 
        senderId: { $ne: userId },
        status: { $ne: 'read' }
      },
      { status: 'read' }
    );

    // Reset unread count for this user in the conversation
    await Chat.findByIdAndUpdate(conversationId, {
      $set: { 'participants.$[elem].unreadCount': 0 }
    }, {
      arrayFilters: [{ 'elem.userId': userId }]
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
});

// Get online users - real employees from database
router.get('/online-users', async (req, res) => {
  try {
    const { userType } = req.query; // admin or employee
    
    let onlineUsers = [];
    
    if (userType === 'admin') {
      // Admin can see all employees
      const employees = await Employee.find(
        { teamMemberName: { $exists: true, $ne: '' } }, 
        'teamMemberName teamMemberEmail emergencyMobileNumber role'
      ).limit(50);

      onlineUsers = employees.map(emp => ({
        userId: emp._id,
        name: emp.teamMemberName,
        email: emp.teamMemberEmail,
        phone: emp.emergencyMobileNumber,
        userType: 'employee',
        role: emp.role || 'Employee',
        status: Math.random() > 0.3 ? 'online' : 'away', // Random status for demo
        lastSeen: new Date()
      }));
    } else {
      // Employees can see admin and other employees
      const employees = await Employee.find(
        { teamMemberName: { $exists: true, $ne: '' } }, 
        'teamMemberName teamMemberEmail emergencyMobileNumber role'
      ).limit(20);

      onlineUsers = employees.map(emp => ({
        userId: emp._id,
        name: emp.teamMemberName,
        email: emp.teamMemberEmail,
        phone: emp.emergencyMobileNumber,
        userType: 'employee',
        role: emp.role || 'Employee',
        status: Math.random() > 0.3 ? 'online' : 'away',
        lastSeen: new Date()
      }));

      // Add admin user for employees
      onlineUsers.unshift({
        userId: 'admin_user',
        name: 'Admin',
        email: 'admin@crm.com',
        userType: 'admin',
        role: 'Administrator',
        status: 'online',
        lastSeen: new Date()
      });
    }

    res.json({
      success: true,
      users: onlineUsers
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users',
      error: error.message
    });
  }
});

// Get new messages for a user (for polling)
router.get('/messages/:userId/new', async (req, res) => {
  try {
    const { userId } = req.params;
    const { since } = req.query;
    
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60000); // Last minute
    
    // Find conversations where user is a participant
    const conversations = await Chat.find({
      'participants.userId': userId
    }).select('_id');
    
    const conversationIds = conversations.map(c => c._id);
    
    // Find new messages in these conversations
    const newMessages = await Message.find({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      timestamp: { $gt: sinceDate }
    })
    .populate('senderId', 'teamMemberName name email')
    .sort({ timestamp: 1 });

    res.json({
      success: true,
      messages: newMessages.map(msg => ({
        _id: msg._id,
        conversationId: msg.conversationId,
        content: msg.content,
        messageType: msg.messageType,
        senderId: msg.senderId._id,
        senderType: msg.senderType,
        senderName: msg.senderId.teamMemberName || msg.senderId.name || 'Unknown User',
        timestamp: msg.timestamp,
        status: msg.status
      }))
    });
  } catch (error) {
    console.error('Error fetching new messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new messages',
      error: error.message
    });
  }
});

module.exports = router;
