const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// Create sample employees with the specified company ID format
async function createSampleEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Company ID in the format specified by user
    const companyId = '68babac58ab96e9658ba62a0';
    console.log('🏢 Creating employees for company ID:', companyId);

    // Sample employees data
    const sampleEmployees = [
      {
        company: companyId,
        teamMemberName: 'Rajesh Kumar',
        teamMemberEmail: 'rajesh.kumar@company.com',
        email: 'rajesh.kumar@company.com',
        password: 'password123',
        role: 'Sales Manager',
        emergencyMobileNumber: '9876543210',
        salary: '50000',
        employeeId: 'EMP001',
        dateOfJoining: new Date('2023-01-15'),
        shift: 'Day',
        address: 'Mumbai, Maharashtra'
      },
      {
        company: companyId,
        teamMemberName: 'Priya Sharma',
        teamMemberEmail: 'priya.sharma@company.com',
        email: 'priya.sharma@company.com',
        password: 'password123',
        role: 'Sales Executive',
        emergencyMobileNumber: '9876543211',
        salary: '35000',
        employeeId: 'EMP002',
        dateOfJoining: new Date('2023-02-20'),
        shift: 'Day',
        address: 'Delhi, India'
      },
      {
        company: companyId,
        teamMemberName: 'Amit Patel',
        teamMemberEmail: 'amit.patel@company.com',
        email: 'amit.patel@company.com',
        password: 'password123',
        role: 'Lead Generator',
        emergencyMobileNumber: '9876543212',
        salary: '30000',
        employeeId: 'EMP003',
        dateOfJoining: new Date('2023-03-10'),
        shift: 'Day',
        address: 'Ahmedabad, Gujarat'
      },
      {
        company: companyId,
        teamMemberName: 'Sneha Reddy',
        teamMemberEmail: 'sneha.reddy@company.com',
        email: 'sneha.reddy@company.com',
        password: 'password123',
        role: 'Sales Executive',
        emergencyMobileNumber: '9876543213',
        salary: '35000',
        employeeId: 'EMP004',
        dateOfJoining: new Date('2023-04-05'),
        shift: 'Day',
        address: 'Hyderabad, Telangana'
      },
      {
        company: companyId,
        teamMemberName: 'Vikram Singh',
        teamMemberEmail: 'vikram.singh@company.com',
        email: 'vikram.singh@company.com',
        password: 'password123',
        role: 'Senior Sales Executive',
        emergencyMobileNumber: '9876543214',
        salary: '45000',
        employeeId: 'EMP005',
        dateOfJoining: new Date('2022-12-01'),
        shift: 'Day',
        address: 'Jaipur, Rajasthan'
      }
    ];

    // Check if employees already exist
    const existingEmails = await Employee.find({
      teamMemberEmail: { $in: sampleEmployees.map(emp => emp.teamMemberEmail) }
    }).select('teamMemberEmail');

    const existingEmailSet = new Set(existingEmails.map(emp => emp.teamMemberEmail));
    const newEmployees = sampleEmployees.filter(emp => !existingEmailSet.has(emp.teamMemberEmail));

    if (newEmployees.length === 0) {
      console.log('ℹ️ All sample employees already exist');
    } else {
      // Create new employees
      const createdEmployees = await Employee.insertMany(newEmployees);
      console.log(`✅ Created ${createdEmployees.length} new employees`);
      
      createdEmployees.forEach(emp => {
        console.log(`- ${emp.teamMemberName} (${emp.role}) - ID: ${emp._id}`);
      });
    }

    // Verify employees were created for the company
    console.log('\n🔍 Verifying employees for company:', companyId);
    const companyEmployees = await Employee.find({ company: companyId });
    console.log(`📊 Total employees found for company: ${companyEmployees.length}`);
    
    companyEmployees.forEach(emp => {
      console.log(`- ${emp.teamMemberName} (${emp.role}) - Company: ${emp.company}`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createSampleEmployees();
