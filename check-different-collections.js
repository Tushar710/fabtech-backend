const mongoose = require('mongoose');

// Check if there are employees in different collections or with different company field formats
async function checkDifferentCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const companyId = '68babac58ab96e9658ba62a0';
    console.log('🔍 Company ID:', companyId);

    // Check all collections in the database
    console.log('\n📋 ALL COLLECTIONS IN DATABASE:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // Check employees collection with different query formats
    console.log('\n🔍 CHECKING EMPLOYEES WITH DIFFERENT FORMATS:');
    
    // 1. String format
    const stringEmployees = await mongoose.connection.db.collection('employees')
      .find({ company: companyId })
      .toArray();
    console.log(`📊 String company format: ${stringEmployees.length} employees`);
    
    // 2. ObjectId format
    const objectIdEmployees = await mongoose.connection.db.collection('employees')
      .find({ company: new mongoose.Types.ObjectId(companyId) })
      .toArray();
    console.log(`📊 ObjectId company format: ${objectIdEmployees.length} employees`);
    
    // 3. Check for employees with company as nested object
    const nestedEmployees = await mongoose.connection.db.collection('employees')
      .find({ "company._id": companyId })
      .toArray();
    console.log(`📊 Nested company._id format: ${nestedEmployees.length} employees`);
    
    // 4. Check for employees with company.$oid format
    const oidEmployees = await mongoose.connection.db.collection('employees')
      .find({ "company.$oid": companyId })
      .toArray();
    console.log(`📊 company.$oid format: ${oidEmployees.length} employees`);

    // Get ALL employees regardless of company
    console.log('\n📋 ALL EMPLOYEES IN DATABASE (any company):');
    const allEmployees = await mongoose.connection.db.collection('employees')
      .find({})
      .toArray();
    
    console.log(`📊 Total employees: ${allEmployees.length}`);
    
    allEmployees.forEach((emp, index) => {
      console.log(`\n👤 Employee ${index + 1}: ${emp.teamMemberName}`);
      console.log(`- ID: ${emp._id}`);
      console.log(`- Company: ${JSON.stringify(emp.company)} (${typeof emp.company})`);
      console.log(`- Email: ${emp.email}`);
      
      // Check if this employee matches our company ID in any format
      let matches = false;
      if (emp.company === companyId) matches = true;
      if (emp.company && emp.company._id === companyId) matches = true;
      if (emp.company && emp.company.$oid === companyId) matches = true;
      if (emp.company && emp.company.toString() === companyId) matches = true;
      
      console.log(`- Matches Company ID: ${matches ? 'YES ✅' : 'NO ❌'}`);
    });

    // Check if there's a different employee collection
    console.log('\n🔍 CHECKING OTHER POSSIBLE EMPLOYEE COLLECTIONS:');
    const possibleCollections = ['employee', 'team_members', 'users', 'staff'];
    
    for (const colName of possibleCollections) {
      try {
        const count = await mongoose.connection.db.collection(colName).countDocuments();
        if (count > 0) {
          console.log(`📊 Collection '${colName}': ${count} documents`);
          const sample = await mongoose.connection.db.collection(colName).findOne();
          if (sample) {
            console.log(`   Sample: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
          }
        }
      } catch (err) {
        // Collection doesn't exist, skip
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkDifferentCollections();
