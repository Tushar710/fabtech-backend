const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Lead = require('./models/Lead');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testEmployeeDashboard() {
  try {
    console.log('🧪 Testing employee dashboard flow...');
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      mongoose.connection.on('connected', resolve);
      mongoose.connection.on('error', reject);
      if (mongoose.connection.readyState === 1) resolve();
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test with employee who has assigned leads
    const testEmail = 'shubham@gmail.com';
    console.log(`\n🔍 Testing with employee: ${testEmail}`);
    
    // Get employee data
    const db = mongoose.connection.db;
    const employee = await db.collection('employees').findOne({ 
      $or: [
        { teamMemberEmail: testEmail },
        { email: testEmail }
      ]
    });
    
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }
    
    console.log('👤 Employee found:', {
      id: employee._id,
      name: employee.teamMemberName,
      email: employee.teamMemberEmail || employee.email
    });
    
    // Test dashboard query (same as employeeDashboard.js)
    const employeeId = employee._id;
    console.log(`\n📊 Querying leads for employee ID: ${employeeId}`);
    
    let assignedToQuery;
    try {
      assignedToQuery = new mongoose.Types.ObjectId(employeeId);
    } catch {
      assignedToQuery = employeeId.toString();
    }
    
    const assignedLeads = await Lead.find({ 
      $or: [
        { assignedTo: assignedToQuery },
        { assignedTo: employeeId.toString() }
      ],
      isActive: { $ne: false }
    }).sort({ createdAt: -1 });
    
    console.log(`📋 Found ${assignedLeads.length} assigned leads`);
    
    if (assignedLeads.length > 0) {
      console.log('\n✅ SUCCESS! Employee has assigned leads:');
      assignedLeads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.name} (${lead.email}) - Status: ${lead.status}`);
      });
      
      console.log('\n🎉 EMPLOYEE DASHBOARD SHOULD WORK!');
      console.log(`\n🔑 Login with:`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: 123`);
      console.log(`   Expected leads: ${assignedLeads.length}`);
      
    } else {
      console.log('\n⚠️ No leads assigned to this employee');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testEmployeeDashboard();
