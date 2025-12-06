const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function listEmployees() {
  try {
    console.log('🔍 Listing all employees...');
    
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
    
    console.log(`📊 Found ${employees.length} total employees:`);
    console.log('');
    
    employees.forEach((emp, index) => {
      console.log(`👤 Employee ${index + 1}:`);
      console.log(`   ID: ${emp._id}`);
      console.log(`   Name: ${emp.teamMemberName || 'No name'}`);
      console.log(`   Email: ${emp.teamMemberEmail || emp.email || 'No email'}`);
      console.log(`   Phone: ${emp.emergencyMobileNumber || 'No phone'}`);
      console.log(`   Role: ${emp.role || 'No role'}`);
      console.log('   ---');
    });
    
    // Show employees with valid login credentials
    const validEmployees = employees.filter(emp => 
      (emp.teamMemberEmail || emp.email) && 
      (emp.teamMemberName || emp.name)
    );
    
    console.log(`\n🔑 Employees with valid login credentials (${validEmployees.length}):`);
    validEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.teamMemberName} - ${emp.teamMemberEmail || emp.email} (Password: 123)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

listEmployees();
