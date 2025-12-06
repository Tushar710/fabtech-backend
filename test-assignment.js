const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const Employee = require('./models/Employee');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testAssignment() {
  try {
    console.log('🔍 Testing lead assignment...');
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      mongoose.connection.on('connected', resolve);
      mongoose.connection.on('error', reject);
      if (mongoose.connection.readyState === 1) resolve();
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get all employees
    const db = mongoose.connection.db;
    const employees = await db.collection('employees').find({}).toArray();
    console.log(`📊 Found ${employees.length} employees`);
    
    if (employees.length > 0) {
      const firstEmployee = employees[0];
      console.log('👤 First employee:', {
        id: firstEmployee._id,
        name: firstEmployee.teamMemberName,
        email: firstEmployee.teamMemberEmail
      });
      
      // Get all leads
      const leads = await Lead.find({}).limit(5);
      console.log(`📋 Found ${leads.length} leads`);
      
      if (leads.length > 0) {
        const firstLead = leads[0];
        console.log('📝 First lead:', {
          id: firstLead._id,
          name: firstLead.name,
          email: firstLead.email,
          assignedTo: firstLead.assignedTo
        });
        
        // Test assignment
        console.log('🔄 Testing assignment...');
        const updatedLead = await Lead.findByIdAndUpdate(
          firstLead._id,
          {
            assignedTo: firstEmployee._id,
            assignedAt: new Date(),
            assignmentNotes: 'Test assignment'
          },
          { new: true }
        );
        
        console.log('✅ Lead assigned:', {
          leadId: updatedLead._id,
          assignedTo: updatedLead.assignedTo,
          assignedAt: updatedLead.assignedAt
        });
        
        // Test query for assigned leads
        console.log('🔍 Testing query for assigned leads...');
        const assignedLeads = await Lead.find({
          assignedTo: firstEmployee._id
        });
        
        console.log(`📊 Found ${assignedLeads.length} leads assigned to ${firstEmployee.teamMemberName}`);
        
        // Test with string ID
        const assignedLeadsString = await Lead.find({
          assignedTo: firstEmployee._id.toString()
        });
        
        console.log(`📊 Found ${assignedLeadsString.length} leads assigned (string query)`);
        
        // Test with $or query like in dashboard
        const assignedLeadsOr = await Lead.find({
          $or: [
            { assignedTo: firstEmployee._id },
            { assignedTo: firstEmployee._id.toString() }
          ]
        });
        
        console.log(`📊 Found ${assignedLeadsOr.length} leads assigned ($or query)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAssignment();
