const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function unassignAllLeads() {
  try {
    console.log('🔄 Unassigning all leads from employees...');
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      mongoose.connection.on('connected', resolve);
      mongoose.connection.on('error', reject);
      if (mongoose.connection.readyState === 1) resolve();
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find all assigned leads
    const assignedLeads = await Lead.find({
      assignedTo: { $exists: true, $ne: null }
    });
    
    console.log(`📋 Found ${assignedLeads.length} assigned leads`);
    
    if (assignedLeads.length > 0) {
      // Unassign all leads
      const result = await Lead.updateMany(
        { assignedTo: { $exists: true, $ne: null } },
        {
          $unset: {
            assignedTo: 1,
            assignedAt: 1,
            assignmentNotes: 1
          }
        }
      );
      
      console.log(`✅ Unassigned ${result.modifiedCount} leads successfully`);
      
      // Verify unassignment
      const remainingAssigned = await Lead.find({
        assignedTo: { $exists: true, $ne: null }
      });
      
      console.log(`📊 Remaining assigned leads: ${remainingAssigned.length}`);
      
      if (remainingAssigned.length === 0) {
        console.log('🎉 All leads have been unassigned successfully!');
        console.log('');
        console.log('📝 Now you can:');
        console.log('1. Login as admin/manager');
        console.log('2. Go to Lead Management dashboard');
        console.log('3. Select leads and assign them to employees manually');
        console.log('4. Employee dashboards will only show leads you assign');
        console.log('');
        console.log('🔑 Admin Login:');
        console.log('   Email: admin@crm.com');
        console.log('   Password: admin123');
        console.log('');
        console.log('🔑 Employee Login (after assignment):');
        console.log('   Email: shubham@gmail.com');
        console.log('   Password: 123');
      }
    } else {
      console.log('ℹ️ No leads are currently assigned to employees');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

unassignAllLeads();
