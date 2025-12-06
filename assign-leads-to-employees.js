const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function assignLeadsToEmployees() {
  try {
    console.log('🔄 Assigning leads to employees...');
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      mongoose.connection.on('connected', resolve);
      mongoose.connection.on('error', reject);
      if (mongoose.connection.readyState === 1) resolve();
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get employees
    const db = mongoose.connection.db;
    const employees = await db.collection('employees').find({}).toArray();
    console.log(`👥 Found ${employees.length} employees`);
    
    // Get unassigned leads
    const unassignedLeads = await Lead.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).limit(20);
    
    console.log(`📋 Found ${unassignedLeads.length} unassigned leads`);
    
    if (unassignedLeads.length === 0) {
      console.log('⚠️ No unassigned leads found. Creating some sample leads...');
      
      // Create sample leads
      const sampleLeads = [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          company: 'ABC Corp',
          status: 'new',
          priority: 'medium',
          source: 'website',
          notes: 'Interested in our premium package',
          userId: new mongoose.Types.ObjectId() // Required field
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          company: 'XYZ Ltd',
          status: 'new',
          priority: 'high',
          source: 'referral',
          notes: 'Urgent requirement for enterprise solution',
          userId: new mongoose.Types.ObjectId()
        },
        {
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phone: '+1234567892',
          company: 'Tech Solutions',
          status: 'new',
          priority: 'low',
          source: 'linkedin',
          notes: 'Initial inquiry about pricing',
          userId: new mongoose.Types.ObjectId()
        },
        {
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          phone: '+1234567893',
          company: 'Digital Agency',
          status: 'new',
          priority: 'medium',
          source: 'facebook',
          notes: 'Looking for marketing automation tools',
          userId: new mongoose.Types.ObjectId()
        },
        {
          name: 'David Brown',
          email: 'david.brown@example.com',
          phone: '+1234567894',
          company: 'Startup Inc',
          status: 'new',
          priority: 'high',
          source: 'email_campaign',
          notes: 'Responded to our email campaign',
          userId: new mongoose.Types.ObjectId()
        }
      ];
      
      const createdLeads = await Lead.insertMany(sampleLeads);
      console.log(`✅ Created ${createdLeads.length} sample leads`);
      
      // Update unassigned leads list
      const newUnassignedLeads = await Lead.find({
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: null }
        ]
      }).limit(20);
      
      console.log(`📋 Now have ${newUnassignedLeads.length} unassigned leads`);
    }
    
    // Get fresh list of unassigned leads
    const leadsToAssign = await Lead.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).limit(employees.length * 2); // Assign 2 leads per employee
    
    if (leadsToAssign.length > 0 && employees.length > 0) {
      console.log('🔄 Starting lead assignment...');
      
      let assignmentCount = 0;
      
      for (let i = 0; i < leadsToAssign.length; i++) {
        const lead = leadsToAssign[i];
        const employee = employees[i % employees.length]; // Round-robin assignment
        
        await Lead.findByIdAndUpdate(
          lead._id,
          {
            assignedTo: employee._id,
            assignedAt: new Date(),
            assignmentNotes: `Auto-assigned to ${employee.teamMemberName} for testing`
          }
        );
        
        assignmentCount++;
        console.log(`✅ Assigned "${lead.name}" to ${employee.teamMemberName} (${employee.teamMemberEmail || employee.email})`);
      }
      
      console.log(`\n🎉 Successfully assigned ${assignmentCount} leads to employees!`);
      
      // Show assignment summary
      console.log('\n📊 Assignment Summary:');
      for (const employee of employees) {
        const assignedLeads = await Lead.find({ assignedTo: employee._id });
        console.log(`👤 ${employee.teamMemberName}: ${assignedLeads.length} leads assigned`);
      }
      
      console.log('\n🔑 Employee Login Instructions:');
      console.log('Employees can now log in with:');
      employees.forEach((emp, index) => {
        if (emp.teamMemberEmail || emp.email) {
          console.log(`${index + 1}. Email: ${emp.teamMemberEmail || emp.email}, Password: 123`);
        }
      });
      
    } else {
      console.log('⚠️ No leads or employees available for assignment');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

assignLeadsToEmployees();
