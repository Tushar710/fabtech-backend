const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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
    
    // Get sample JWT token from localStorage (simulate frontend)
    console.log('🔍 DEBUGGING EMPLOYEE AUTH ISSUE');
    console.log('=' .repeat(50));
    
    // Check employees collection
    const employeesCollection = db.collection('employees');
    const allEmployees = await employeesCollection.find({}).toArray();
    
    console.log(`\n📊 Total employees in database: ${allEmployees.length}`);
    
    // Group employees by company
    const employeesByCompany = {};
    allEmployees.forEach(emp => {
      const companyId = emp.company;
      if (!employeesByCompany[companyId]) {
        employeesByCompany[companyId] = [];
      }
      employeesByCompany[companyId].push(emp);
    });
    
    console.log('\n🏢 EMPLOYEES BY COMPANY:');
    Object.keys(employeesByCompany).forEach(companyId => {
      const employees = employeesByCompany[companyId];
      console.log(`\nCompany ID: ${companyId}`);
      console.log(`Employees: ${employees.length}`);
      employees.forEach((emp, index) => {
        console.log(`  ${index + 1}. ${emp.teamMemberName} (${emp.teamMemberEmail})`);
      });
    });
    
    // Check companies collection to get the logged-in user's company
    const companiesCollection = db.collection('companies');
    const companies = await companiesCollection.find({}).toArray();
    
    console.log('\n🏢 COMPANIES IN DATABASE:');
    companies.forEach(company => {
      console.log(`ID: ${company._id} | Name: ${company.businessName} | Email: ${company.businessEmail}`);
    });
    
    // Find the test company (infoysh@gmail.com)
    const testCompany = companies.find(c => c.businessEmail === 'infoysh@gmail.com');
    
    if (testCompany) {
      console.log(`\n🎯 TEST COMPANY FOUND:`);
      console.log(`Company ID: ${testCompany._id}`);
      console.log(`Company Name: ${testCompany.businessName}`);
      
      // Check if there are employees for this company
      const testCompanyEmployees = allEmployees.filter(emp => emp.company === testCompany._id.toString());
      console.log(`Employees for this company: ${testCompanyEmployees.length}`);
      
      if (testCompanyEmployees.length > 0) {
        console.log('Employee details:');
        testCompanyEmployees.forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.teamMemberName} (${emp.teamMemberEmail})`);
          console.log(`     Company field: ${emp.company}`);
          console.log(`     Company field type: ${typeof emp.company}`);
        });
      } else {
        console.log('❌ No employees found for test company!');
        console.log('This explains why the employee service returns empty data.');
        
        // Check if company ID format matches
        console.log('\n🔍 COMPANY ID FORMAT ANALYSIS:');
        console.log(`Test company ID: ${testCompany._id} (${typeof testCompany._id})`);
        console.log(`Test company ID string: ${testCompany._id.toString()}`);
        
        // Check all unique company values in employees
        const uniqueCompanyIds = [...new Set(allEmployees.map(emp => emp.company))];
        console.log('\nUnique company IDs in employees:');
        uniqueCompanyIds.forEach(id => {
          console.log(`  ${id} (${typeof id})`);
          const matchesTestCompany = id === testCompany._id.toString();
          console.log(`    Matches test company: ${matchesTestCompany}`);
        });
      }
    } else {
      console.log('❌ Test company (infoysh@gmail.com) not found!');
    }
    
    console.log('\n💡 SOLUTION RECOMMENDATIONS:');
    if (testCompany && testCompanyEmployees.length === 0) {
      console.log('1. Create employees for the test company');
      console.log('2. Or update existing employees to use correct company ID');
      console.log('3. Verify JWT token contains correct company ID');
    }
    
  } catch (error) {
    console.error('❌ Error debugging employee auth:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
