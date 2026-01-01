const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// Get all tasks for company
router.get('/', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    
    console.log('📋 Fetching all tasks for company:', companyId);
    
    const tasks = await Task.find({ companyId })
      .populate('assignedTo', 'teamMemberName email')
      .populate({
        path: 'createdBy',
        select: 'teamMemberName email name'
      })
      .sort({ createdAt: -1 });
    
    console.log('✅ Found', tasks.length, 'tasks');
    if (tasks.length > 0) {
      console.log('📝 Sample task:');
      console.log('   - Title:', tasks[0].title);
      console.log('   - Assigned to:', tasks[0].assignedTo?.teamMemberName);
      console.log('   - Created by:', tasks[0].createdBy?.teamMemberName || tasks[0].createdBy?.name);
      console.log('   - createdByName field:', tasks[0].createdByName);
    }
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// Get tasks for specific employee
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    
    console.log('🔍 Fetching tasks for employee:', employeeId);
    console.log('👤 User object:', req.user);
    
    // Find tasks assigned to this employee OR created by this employee
    const tasks = await Task.find({
      $or: [
        { assignedTo: employeeId },
        { createdBy: employeeId }
      ]
    })
    .populate('assignedTo', 'teamMemberName email')
    .populate({
      path: 'createdBy',
      select: 'teamMemberName email name'
    })
    .sort({ createdAt: -1 });
    
    console.log('📋 Tasks found:', tasks.length);
    
    // Debug: Log first task details
    if (tasks.length > 0) {
      console.log('📝 First task details:');
      console.log('   - assignedTo:', tasks[0].assignedTo);
      console.log('   - createdBy:', tasks[0].createdBy);
      console.log('   - createdByName:', tasks[0].createdByName);
    }
    
    // Separate tasks into categories
    const assignedToMe = tasks.filter(task => {
      const isAssigned = task.assignedTo && task.assignedTo._id.toString() === employeeId.toString();
      if (isAssigned) {
        console.log('✅ Task assigned to me:', task.title);
      }
      return isAssigned;
    });
    
    const createdByMe = tasks.filter(task => {
      // Handle both populated (object) and non-populated (ObjectId) cases
      const createdById = task.createdBy?._id 
        ? task.createdBy._id.toString() 
        : task.createdBy?.toString();
      
      const isCreated = createdById === employeeId.toString();
      
      if (isCreated) {
        console.log('✅ Task created by me:', task.title);
      }
      return isCreated;
    });
    
    console.log('📥 Tasks assigned to me:', assignedToMe.length);
    console.log('📤 Tasks created by me:', createdByMe.length);
    
    res.json({
      success: true,
      data: tasks,
      stats: {
        total: tasks.length,
        assignedToMe: assignedToMe.length,
        createdByMe: createdByMe.length
      }
    });
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, reminderDate } = req.body;
    
    if (!title || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Title and assignedTo are required'
      });
    }

    const companyId = req.user.companyId || req.user.company;
    
    // Check if assigning to company or employee
    let assignedToName = 'Company';
    let assignedToId = null;
    let branchId = null;
    
    if (assignedTo === 'company') {
      // Task assigned to company
      console.log('📋 Task assigned to company');
      assignedToId = companyId; // Store company ID
      assignedToName = 'Company';
    } else {
      // Task assigned to specific employee
      const employee = await Employee.findById(assignedTo);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
      assignedToId = employee._id;
      assignedToName = employee.teamMemberName;
      branchId = employee.branch;
    }
    
    // Get creator name - handle both employee and company users
    let creatorName = req.user.teamMemberName || req.user.name || req.user.email;
    
    // If it's a company user (not employee), try to get company name
    if (req.user.role !== 'employee' && !req.user.teamMemberName) {
      try {
        const Company = require('../models/Company');
        const company = await Company.findById(companyId);
        if (company) {
          creatorName = company.businessName || company.companyName || company.name || creatorName;
          console.log('   - Company name found:', creatorName);
        }
      } catch (err) {
        console.log('   - Could not fetch company name:', err.message);
      }
    }
    
    console.log('📝 Creating task:');
    console.log('   - User role:', req.user.role);
    console.log('   - Created by:', creatorName);
    console.log('   - Assigned to:', assignedToName);
    console.log('   - Assigned to type:', assignedTo === 'company' ? 'Company' : 'Employee');
    
    const task = new Task({
      title,
      description,
      assignedTo: assignedToId,
      assignedToName: assignedToName,
      assignedToType: assignedTo === 'company' ? 'company' : 'employee',
      priority: priority || 'medium',
      dueDate,
      reminderDate: reminderDate || null,
      reminderSent: false,
      companyId,
      branchId: branchId,
      createdBy: req.user.id || req.user._id,
      createdByModel: req.user.role === 'employee' ? 'Employee' : 'User',
      createdByName: creatorName
    });

    await task.save();
    
    console.log('✅ Task created with createdByName:', task.createdByName);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, priority, dueDate, reminderDate } = req.body;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task is completed - prevent editing
    if (task.status === 'completed' && task.completionDate) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit a completed task. Task is locked.'
      });
    }

    // Check if user has permission to update
    const companyId = req.user.companyId || req.user.company;
    if (task.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (reminderDate !== undefined) {
      task.reminderDate = reminderDate;
      task.reminderSent = false; // Reset reminder sent flag when reminder is updated
    }
    
    if (assignedTo && assignedTo !== task.assignedTo.toString()) {
      const employee = await Employee.findById(assignedTo);
      if (employee) {
        task.assignedTo = assignedTo;
        task.assignedToName = employee.teamMemberName;
      }
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// Update task status (for employees)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task is already completed - prevent further updates
    if (task.status === 'completed' && task.completionDate) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update a completed task. Task is locked.'
      });
    }

    // Add update to history
    const update = {
      status,
      comment: comment || '',
      timestamp: new Date(),
      updatedBy: req.user.id || req.user._id,
      updatedByModel: req.user.role === 'employee' ? 'Employee' : 'User',
      updatedByName: req.user.name || req.user.teamMemberName
    };

    task.status = status;
    task.updates.push(update);
    
    // Set completion date when task is marked as completed
    if (status === 'completed' && !task.completionDate) {
      task.completionDate = new Date();
      console.log('✅ Task completed on:', task.completionDate);
    }
    
    await task.save();

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message
    });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to delete
    const userId = req.user.id || req.user._id;
    const companyId = req.user.companyId || req.user.company;
    
    // Allow deletion if:
    // 1. Same company
    // 2. User is the creator of the task OR user is company admin
    const isSameCompany = task.companyId.toString() === companyId.toString();
    const isCreator = task.createdBy && task.createdBy.toString() === userId.toString();
    const isCompanyAdmin = req.user.role !== 'employee';
    
    if (!isSameCompany) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }
    
    if (!isCreator && !isCompanyAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the task creator or admin can delete this task'
      });
    }

    console.log('🗑️ Deleting task:', task.title);
    console.log('   - Deleted by:', req.user.teamMemberName || req.user.name);
    
    await Task.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

// Get task statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.company;
    
    const stats = await Task.aggregate([
      { $match: { companyId: mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      pending: 0,
      'in-progress': 0,
      completed: 0,
      'on-hold': 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      summary.total += stat.count;
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task statistics',
      error: error.message
    });
  }
});

module.exports = router;
