const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    debugEmployees();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function debugEmployees() {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('employees');
    
    // Get all employees
    const employees = await collection.find({}).toArray();
    console.log(`📊 Total employees in database: ${employees.length}`);
    
    console.log('\n🔍 EMPLOYEE DATA ANALYSIS:');
    console.log('=' .repeat(50));
    
    employees.forEach((emp, index) => {
      console.log(`\n👤 Employee ${index + 1}:`);
      console.log(`   Name: ${emp.teamMemberName || emp.name || 'Unknown'}`);
      console.log(`   Email: ${emp.teamMemberEmail || emp.email || 'No email'}`);
      console.log(`   Company Field: ${emp.company || 'No company field'}`);
      console.log(`   CompanyId Field: ${emp.companyId || 'No companyId field'}`);
      console.log(`   Role: ${emp.role || 'No role'}`);
      console.log(`   Department: ${emp.department || 'No department'}`);
      
      // Check all fields that might contain company info
      const companyFields = Object.keys(emp).filter(key => 
        key.toLowerCase().includes('company') || 
        key.toLowerCase().includes('business')
      );
      
      if (companyFields.length > 0) {
        console.log(`   🏢 Company-related fields: ${companyFields.join(', ')}`);
        companyFields.forEach(field => {
          console.log(`      ${field}: ${emp[field]}`);
        });
      }
    });
    
    // Check for company filtering possibilities
    console.log('\n🎯 COMPANY FILTERING ANALYSIS:');
    console.log('=' .repeat(40));
    
    const withCompany = employees.filter(emp => emp.company);
    const withCompanyId = employees.filter(emp => emp.companyId);
    const withoutCompanyInfo = employees.filter(emp => !emp.company && !emp.companyId);
    
    console.log(`📈 Employees with 'company' field: ${withCompany.length}`);
    console.log(`📈 Employees with 'companyId' field: ${withCompanyId.length}`);
    console.log(`📉 Employees without company info: ${withoutCompanyInfo.length}`);
    
    if (withCompany.length > 0) {
      console.log('\n🏢 Company field values:');
      const companyValues = [...new Set(withCompany.map(emp => emp.company))];
      companyValues.forEach(val => {
        const count = withCompany.filter(emp => emp.company === val).length;
        console.log(`   ${val}: ${count} employees`);
      });
    }
    
    if (withCompanyId.length > 0) {
      console.log('\n🏢 CompanyId field values:');
      const companyIdValues = [...new Set(withCompanyId.map(emp => emp.companyId))];
      companyIdValues.forEach(val => {
        const count = withCompanyId.filter(emp => emp.companyId === val).length;
        console.log(`   ${val}: ${count} employees`);
      });
    }
    
    console.log('\n💡 RECOMMENDATION:');
    if (withoutCompanyInfo.length === employees.length) {
      console.log('❌ No employees have company information - need to add companyId field');
    } else if (withCompanyId.length > 0) {
      console.log('✅ Use companyId field for filtering');
    } else if (withCompany.length > 0) {
      console.log('✅ Use company field for filtering');
    }
    
  } catch (error) {
    console.error('❌ Error debugging employees:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}
