const express = require('express');
const router = express.Router();
const SelfReport = require('../models/SelfReport');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');
const { getISTDateRange, getISTStartOfDay } = require('../utils/timezone');

// Get today's report for logged-in employee
router.get('/today', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;

    // Get today's date range in IST
    const { start, end } = getISTDateRange(new Date());

    console.log('📅 IST Today Range:', {
      start: start.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      end: end.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    let report = await SelfReport.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    // If no report exists, create a new one
    if (!report) {
      const employee = await Employee.findById(employeeId);

      report = new SelfReport({
        employeeId,
        employeeName: employee.teamMemberName || employee.name,
        companyId: employee.company,
        branchId: employee.branch,
        date: getISTStartOfDay(),
        hourlyActivities: [],
        isSubmitted: false
      });

      await report.save();
      console.log('✅ Created new IST report for:', report.date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching today\'s report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

// Get report by date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { date } = req.params;

    // Get date range in IST
    const { start, end } = getISTDateRange(new Date(date));

    console.log('📅 IST Date Range for', date, ':', {
      start: start.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      end: end.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    const report = await SelfReport.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report by date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

// Get all reports for employee (with pagination)
router.get('/my-reports', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const reports = await SelfReport.find({ employeeId })
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SelfReport.countDocuments({ employeeId });

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// Add/Update hourly activity (now supports flexible time ranges)
router.post('/activity', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { startTime, endTime, timeSlot, duration, activity, description, status, date } = req.body;

    console.log('📥 Received activity data:', {
      startTime,
      endTime,
      timeSlot,
      duration,
      activity,
      description,
      status,
      date
    });

    if (!startTime || !endTime || !timeSlot || !activity) {
      console.error('❌ Validation failed:', {
        hasStartTime: !!startTime,
        hasEndTime: !!endTime,
        hasTimeSlot: !!timeSlot,
        hasActivity: !!activity
      });
      return res.status(400).json({
        success: false,
        message: 'Start time, end time, timeSlot, and activity are required',
        received: { startTime, endTime, timeSlot, activity }
      });
    }

    // Get target date range in IST (default to today)
    const targetDate = date ? new Date(date) : new Date();
    const { start, end } = getISTDateRange(targetDate);

    console.log('📝 Adding flexible activity for IST date:', {
      date: start.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      timeSlot,
      duration,
      activity
    });

    let report = await SelfReport.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    // Create report if doesn't exist
    if (!report) {
      const employee = await Employee.findById(employeeId);

      report = new SelfReport({
        employeeId,
        employeeName: employee.teamMemberName || employee.name,
        companyId: employee.company,
        branchId: employee.branch,
        date: getISTStartOfDay(targetDate),
        hourlyActivities: [],
        isSubmitted: false
      });
    }

    // Add new activity with flexible time range
    report.hourlyActivities.push({
      startTime,
      endTime,
      timeSlot,
      duration: parseFloat(duration) || 1,
      activity,
      description: description || '',
      status: status || 'completed'
    });

    // Sort by start time
    report.hourlyActivities.sort((a, b) => {
      const aStart = a.startTime || '00:00';
      const bStart = b.startTime || '00:00';
      return aStart.localeCompare(bStart);
    });

    // Calculate total hours worked (sum of durations)
    const totalHours = report.hourlyActivities.reduce((sum, act) => {
      return sum + (act.duration || 1);
    }, 0);
    report.totalHoursWorked = parseFloat(totalHours.toFixed(2)); // Round to 2 decimal places

    await report.save();

    res.json({
      success: true,
      message: 'Activity added successfully',
      data: report
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add activity',
      error: error.message
    });
  }
});

// Update existing activity
router.put('/activity', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { activityId, startTime, endTime, timeSlot, duration, activity, description, status, date } = req.body;

    if (!activityId || !startTime || !endTime || !timeSlot || !activity) {
      return res.status(400).json({
        success: false,
        message: 'Activity ID, start time, end time, timeSlot, and activity are required'
      });
    }

    // Get target date range in IST
    const targetDate = date ? new Date(date) : new Date();
    const { start, end } = getISTDateRange(targetDate);

    const report = await SelfReport.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Find and update the activity
    const activityIndex = report.hourlyActivities.findIndex(a => a._id.toString() === activityId);

    if (activityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    report.hourlyActivities[activityIndex] = {
      _id: activityId,
      startTime,
      endTime,
      timeSlot,
      duration: parseFloat(duration) || 1,
      activity,
      description: description || '',
      status: status || 'completed'
    };

    // Sort by start time
    report.hourlyActivities.sort((a, b) => {
      const aStart = a.startTime || '00:00';
      const bStart = b.startTime || '00:00';
      return aStart.localeCompare(bStart);
    });

    // Recalculate total hours
    const totalHours = report.hourlyActivities.reduce((sum, act) => {
      return sum + (act.duration || 1);
    }, 0);
    report.totalHoursWorked = parseFloat(totalHours.toFixed(2)); // Round to 2 decimal places

    await report.save();

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
});

// Delete hourly activity (now uses activity ID instead of hour)
router.delete('/activity/:reportId/:activityId', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { reportId, activityId } = req.params;

    const report = await SelfReport.findOne({
      _id: reportId,
      employeeId
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Remove activity by ID
    report.hourlyActivities = report.hourlyActivities.filter(
      a => a._id.toString() !== activityId
    );

    // Recalculate total hours (sum of durations)
    const totalHours = report.hourlyActivities.reduce((sum, act) => {
      return sum + (act.duration || 1);
    }, 0);
    report.totalHoursWorked = parseFloat(totalHours.toFixed(2)); // Round to 2 decimal places

    await report.save();

    res.json({
      success: true,
      message: 'Activity deleted successfully',
      data: report
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
});

// Submit report (finalize for the day)
router.post('/submit', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { overallSummary, achievements, challenges, date } = req.body;

    // Get target date range in IST
    const targetDate = date ? new Date(date) : new Date();
    const { start, end } = getISTDateRange(targetDate);

    const report = await SelfReport.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No report found for today'
      });
    }

    report.overallSummary = overallSummary || '';
    report.achievements = achievements || [];
    report.challenges = challenges || [];
    report.isSubmitted = true;
    report.submittedAt = new Date(); // Current IST time

    await report.save();

    console.log('✅ Report submitted at IST:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

    res.json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
});

// Get all reports for company (admin view)
router.get('/company/all', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    const { date, employeeId, page = 1, limit = 20 } = req.query;

    const query = { companyId };

    if (date) {
      // Use IST date range
      const { start, end } = getISTDateRange(new Date(date));
      query.date = { $gte: start, $lte: end };
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const reports = await SelfReport.find(query)
      .populate('employeeId', 'teamMemberName email')
      .sort({ date: -1, submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SelfReport.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching company reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// Get report statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { startDate, endDate } = req.query;

    const query = { employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const reports = await SelfReport.find(query);

    const stats = {
      totalReports: reports.length,
      totalHoursLogged: reports.reduce((sum, r) => sum + r.totalHoursWorked, 0),
      submittedReports: reports.filter(r => r.isSubmitted).length,
      averageHoursPerDay: 0
    };

    if (reports.length > 0) {
      stats.averageHoursPerDay = (stats.totalHoursLogged / reports.length).toFixed(1);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;
