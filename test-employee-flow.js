const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Lead = require('./models/Lead');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testEmployeeFlow() {
  try {
    console.log('🔍 Testing employee login and dashboard flow...');
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      mongoose.connection.on('connected', resolve);
      mongoose.connection.on('error', reject);
      if (mongoose.connection.readyState === 1) resolve();
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get employees with email addresses
    const db = mongoose.connection.db;
    const employees = await db.collection('employees').find({
      $or: [
        { teamMemberEmail: { $exists: true, $ne: null, $ne: '' } },
        { email: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${employees.length} employees with email addresses`);
    
    if (employees.length > 0) {
      const employee = employees[0];
      console.log('👤 Testing with employee:', {
        id: employee._id,
        name: employee.teamMemberName,
        email: employee.teamMemberEmail || employee.email
      });
      
      // Simulate JWT token creation (like in auth.js)
      const userData = {
        id: employee._id,
        name: employee.teamMemberName,
        email: employee.teamMemberEmail || employee.email,
        userType: 'employee',
        role: employee.role || 'Employee',
        permissions: ['view_assigned_leads', 'update_lead_status', 'add_follow_up', 'view_notifications'],
        phone: employee.emergencyMobileNumber
      };
      
      const token = jwt.sign(
        { 
          id: employee._id, 
          email: employee.teamMemberEmail || employee.email, 
          userType: 'employee',
          role: userData.role,
          permissions: userData.permissions,
          name: userData.name
        },
        'your-secret-key',
        { expiresIn: '1d' }
      );
      
      console.log('🔑 JWT Token created for employee');
      
      // Decode token to simulate dashboard request
      const decoded = jwt.verify(token, 'your-secret-key');
      console.log('🔓 Decoded token:', {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        userType: decoded.userType
      });
      
      // Test dashboard query (same as in employeeDashboard.js)
      const employeeId = decoded.id;
      console.log(`📊 Querying leads for employee ID: ${employeeId}`);
      
      // Handle both string and ObjectId formats like in the dashboard
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
      
      console.log(`📋 Found ${assignedLeads.length} leads assigned to employee`);
      
      if (assignedLeads.length === 0) {
        console.log('⚠️ No leads found! Let\'s assign a lead to this employee...');
        
        // Get a lead to assign
        const availableLeads = await Lead.find({ 
          assignedTo: { $exists: false }
        }).limit(1);
        
        if (availableLeads.length > 0) {
          const leadToAssign = availableLeads[0];
          console.log('📝 Assigning lead:', leadToAssign.name || leadToAssign.email);
          
          const updatedLead = await Lead.findByIdAndUpdate(
            leadToAssign._id,
            {
              assignedTo: employee._id,
              assignedAt: new Date(),
              assignmentNotes: 'Test assignment for employee dashboard'
            },
            { new: true }
          );
          
          console.log('✅ Lead assigned successfully');
          
          // Test query again
          const newAssignedLeads = await Lead.find({ 
            $or: [
              { assignedTo: assignedToQuery },
              { assignedTo: employeeId.toString() }
            ],
            isActive: { $ne: false }
          }).sort({ createdAt: -1 });
          
          console.log(`📋 After assignment: Found ${newAssignedLeads.length} leads`);
          
          if (newAssignedLeads.length > 0) {
            console.log('✅ SUCCESS: Employee dashboard should now show leads!');
            console.log('📄 Lead details:', {
              name: newAssignedLeads[0].name,
              email: newAssignedLeads[0].email,
              assignedTo: newAssignedLeads[0].assignedTo,
              assignedAt: newAssignedLeads[0].assignedAt
            });
          } else {
            console.log('❌ PROBLEM: Still no leads found after assignment');
          }
        } else {
          console.log('⚠️ No available leads to assign');
        }
      } else {
        console.log('✅ SUCCESS: Employee already has assigned leads!');
        assignedLeads.forEach((lead, index) => {
          console.log(`📄 Lead ${index + 1}:`, {
            name: lead.name,
            email: lead.email,
            status: lead.status,
            assignedAt: lead.assignedAt
          });
        });
      }
    } else {
      console.log('❌ No employees with email addresses found');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testEmployeeFlow();
