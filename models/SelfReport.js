const mongoose = require('mongoose');

const hourlyActivitySchema = new mongoose.Schema({
  // Legacy field - kept for backward compatibility
  hour: {
    type: Number,
    required: false, // Made optional for flexible time slots
    min: 0,
    max: 23
  },
  // New flexible time slot fields
  startTime: {
    type: String, // Format: "HH:MM" e.g., "09:00"
    required: false
  },
  endTime: {
    type: String, // Format: "HH:MM" e.g., "11:30"
    required: false
  },
  duration: {
    type: Number, // Duration in hours (e.g., 2.5)
    required: false,
    min: 0
  },
  timeSlot: {
    type: String,
    required: true // e.g., "09:00 - 11:30" or "09:00 - 10:00"
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
