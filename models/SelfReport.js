const mongoose = require('mongoose');

const hourlyActivitySchema = new mongoose.Schema({
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  timeSlot: {
    type: String,
    required: true // e.g., "09:00 - 10:00"
  },
  activity: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'pending'],
    default: 'completed'
  }
});

const selfReportSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: String,
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  date: {
    type: Date,
    required: true
  },
  hourlyActivities: [hourlyActivitySchema],
  totalHoursWorked: {
    type: Number,
    default: 0
  },
  overallSummary: {
    type: String,
    trim: true
  },
  achievements: [{
    type: String,
    trim: true
  }],
  challenges: [{
    type: String,
    trim: true
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isSubmitted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
selfReportSchema.index({ employeeId: 1, date: 1 });
selfReportSchema.index({ companyId: 1, date: 1 });
selfReportSchema.index({ date: 1 });

// Ensure one report per employee per day
selfReportSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SelfReport', selfReportSchema);
