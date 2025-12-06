const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    debugEmployeeAuth();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function debugEmployeeAuth() {
  try {
    const db = mongoose.connection.db;
    
    console.log('🔍 DEBUGGING EMPLOYEE AUTH ISSUE');
    console.log('=' .repeat(50));
    
    // Check employees collection
    const employeesCollection = db.collection('employees');
    const allEmployees = await employeesCollection.find({}).toArray();
    
    console.log(`\n📊 Total employees in database: ${allEmployees.length}`);
    
    // Check companies collection to get the logged-in user's company
    const companiesCollection = db.collection('companies');
    const companies = await companiesCollection.find({}).toArray();
    
    // Find the test company (infoysh@gmail.com)
    const testCompany = companies.find(c => c.businessEmail === 'infoysh@gmail.com');
    
    if (testCompany) {
      console.log(`\n🎯 TEST COMPANY FOUND:`);
      console.log(`Company ID: ${testCompany._id}`);
      console.log(`Company Name: ${testCompany.businessName}`);
      
      // Check if there are employees for this company
      const testCompanyEmployees = allEmployees.filter(emp => emp.company === testCompany._id.toString());
      console.log(`\n📊 Employees for test company: ${testCompanyEmployees.length}`);
      
      if (testCompanyEmployees.length > 0) {
        console.log('\n👥 Employee details:');
        testCompanyEmployees.forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.teamMemberName} (${emp.teamMemberEmail || 'No email'})`);
          console.log(`     Company field: ${emp.company}`);
          console.log(`     Role: ${emp.role}`);
        });
        
        console.log('\n✅ EMPLOYEES FOUND! The issue might be in JWT token extraction.');
        console.log('Check if the JWT token contains the correct company ID.');
      } else {
        console.log('\n❌ No employees found for test company!');
        console.log('This explains why the employee service returns empty data.');
      }
      
      // Show all employees with their company IDs for comparison
      console.log('\n🔍 ALL EMPLOYEES BY COMPANY:');
      const employeesByCompany = {};
      allEmployees.forEach(emp => {
        const companyId = emp.company;
        if (!employeesByCompany[companyId]) {
          employeesByCompany[companyId] = [];
        }
        employeesByCompany[companyId].push(emp);
      });
      
      Object.keys(employeesByCompany).forEach(companyId => {
        const employees = employeesByCompany[companyId];
        const matchesTestCompany = companyId === testCompany._id.toString();
        console.log(`\nCompany ID: ${companyId} ${matchesTestCompany ? '⭐ (TEST COMPANY)' : ''}`);
        console.log(`Employees: ${employees.length}`);
        employees.slice(0, 3).forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.teamMemberName} (${emp.role || 'No role'})`);
        });
        if (employees.length > 3) {
          console.log(`  ... and ${employees.length - 3} more`);
        }
      });
      
    } else {
      console.log('\n❌ Test company (infoysh@gmail.com) not found!');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Check JWT token extraction in auth middleware');
    console.log('2. Verify req.companyId matches the expected company ID');
    console.log('3. Add debug logging to employee route to see actual query');
    
  } catch (error) {
    console.error('❌ Error debugging employee auth:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
