const mongoose = require('mongoose');
const axios = require('axios');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://tusharpawarsj:2505169VPMRvcTsyUQcwSot30350qx3ZTVQZTYNlqTEpuAupFwzOW@cluster0.mongodb.net/crm?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testBulkAssignment = async () => {
  try {
    await connectDB();

    // Get some leads first
    const Lead = require('./models/Lead');
    const Employee = require('./models/Employee');

    console.log('🔍 Finding leads and employees...');

    const leads = await Lead.find({}).limit(2);
    console.log(`📋 Found ${leads.length} leads:`, leads.map(l => ({ id: l._id, name: l.name })));

    const employees = await Employee.find({}).limit(1);
    console.log(`👥 Found ${employees.length} employees:`, employees.map(e => ({ id: e._id, name: e.teamMemberName })));

    if (leads.length === 0 || employees.length === 0) {
      console.log('❌ Need at least 1 lead and 1 employee to test');
      process.exit(1);
    }

    // Test the bulk assignment API
    const testData = {
      leadIds: leads.map(lead => lead._id.toString()),
      assignedTo: employees[0]._id.toString(),
      assignmentNotes: 'Test bulk assignment',
      priority: 'medium'
    };

    console.log('🚀 Testing bulk assignment with data:', testData);

    const response = await axios.put('https://fabtech-backend.onrender.com/api/lead-assignment/bulk-assign', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Bulk assignment successful:', response.data);

  } catch (error) {
    console.error('❌ Bulk assignment failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    mongoose.connection.close();
  }
};

testBulkAssignment();
