const mongoose = require('mongoose');

const taskUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'on-hold'],
    required: true
  },
  comment: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'updatedByModel'
  },
  updatedByModel: {
    type: String,
    enum: ['User', 'Employee']
  },
  updatedByName: String
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assignedToName: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'on-hold'],
    default: 'pending'
  },
  dueDate: Date,
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    enum: ['User', 'Employee']
  },
  createdByName: String,
  updates: [taskUpdateSchema]
}, {
  timestamps: true
});

// Index for faster queries
taskSchema.index({ companyId: 1, assignedTo: 1 });
taskSchema.index({ companyId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
