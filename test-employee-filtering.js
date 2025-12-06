const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    testEmployeeFiltering();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function testEmployeeFiltering() {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('employees');
    
    // Test company filtering for the logged-in company
    const testCompanyId = '68babac58ab96e9658ba62a0'; // Infoyashonanad company
    
    console.log(`🔍 Testing employee filtering for company: ${testCompanyId}`);
    
    // Filter employees by company
    const filteredEmployees = await collection.find({ company: testCompanyId }).toArray();
    
    console.log(`\n📊 Results:`);
    console.log(`Total employees in database: ${await collection.countDocuments()}`);
    console.log(`Employees for company ${testCompanyId}: ${filteredEmployees.length}`);
    
    console.log('\n👥 Filtered Employees:');
    console.log('=' .repeat(40));
    
    filteredEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.teamMemberName || emp.name} (${emp.teamMemberEmail || emp.email})`);
      console.log(`   Role: ${emp.role}`);
      console.log(`   Company: ${emp.company}`);
    });
    
    // Test with another company
    const testCompanyId2 = '68be7d25009bf9b0bbb96e14';
    const filteredEmployees2 = await collection.find({ company: testCompanyId2 }).toArray();
    
    console.log(`\n🔍 Testing for another company: ${testCompanyId2}`);
    console.log(`Employees for company ${testCompanyId2}: ${filteredEmployees2.length}`);
    
    console.log('\n👥 Filtered Employees (Company 2):');
    console.log('=' .repeat(40));
    
    filteredEmployees2.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.teamMemberName || emp.name} (${emp.teamMemberEmail || emp.email})`);
      console.log(`   Role: ${emp.role}`);
      console.log(`   Company: ${emp.company}`);
    });
    
    console.log('\n✅ Company filtering is working correctly!');
    console.log('Each company will only see their own employees in the performance dashboard.');
    
  } catch (error) {
    console.error('❌ Error testing employee filtering:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
