const mongoose = require('mongoose');

// Create employee with the new format structure
async function createNewFormatEmployee() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/crm-lead-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Create employee with the exact new format structure
    const newFormatEmployee = {
      company: "68babac58ab96e9658ba62a0", // String format as required
      teamMemberName: "saiii",
      mobileNumber: "8483821133",
      emergencyMobileNumber: "9794949455",
      email: "saiii@gmail.com",
      password: "$2b$10$YpH8E2IGWQ.ksXUBQgHpBeQJ1659LK4wSnGBqppTEM4tWrFVa2x32",
      salary: "10000",
      dateOfJoining: new Date("2024-09-02T00:00:00.000Z"),
      shift: "Morning",
      department: ["68c2c1621ce4de182d86472f", "68c3c7e055ba6036a3c020f7"],
      role: "Employee",
      designation: ["68ca502337c0902b6c68464b", "68c3ef167e6320c4880ddc04"],
      aadharNumber: "111111111111",
      panNumber: "ABCDE1234D",
      userUpi: "sai@hdfcbank",
      weeklyHoliday: ["Sun"],
      address: "sangli",
      accessPermissions: [
        "list_task",
        "update_task", 
        "delete_task",
        "shifted_task_history",
        "shift_task",
        "create_credit_points",
        "credit_points"
      ],
      profileImage: "https://res.cloudinary.com/dqjhcnw7r/image/upload/v1758018716/employee_images/ffmytgpug8qemoongn4s.png",
      creditPoints: 0,
      adharImage: "https://res.cloudinary.com/dqjhcnw7r/image/upload/v1758167729/employee_images/s56h3iniydnettq3etl9.jpg",
      panImage: "https://res.cloudinary.com/dqjhcnw7r/image/upload/v1758167729/employee_images/enn909cueeynphgjssui.jpg",
      paidLeaves: [{
        type: "Paid Leave",
        count: 10
      }],
      documents: []
    };

    console.log('🆕 Creating employee with new format...');
    
    // Insert directly into collection to maintain exact structure
    const result = await mongoose.connection.db.collection('employees').insertOne(newFormatEmployee);
    console.log('✅ Employee created with ID:', result.insertedId);

    // Verify the created employee
    const createdEmployee = await mongoose.connection.db.collection('employees')
      .findOne({ _id: result.insertedId });
    
    console.log('\n📋 Created employee structure:');
    console.log(JSON.stringify(createdEmployee, null, 2));

    // Test fetching by company ID
    console.log('\n🔍 Testing fetch by company ID...');
    const companyEmployees = await mongoose.connection.db.collection('employees')
      .find({ company: "68babac58ab96e9658ba62a0" })
      .toArray();
    
    console.log(`📊 Found ${companyEmployees.length} employees for company`);
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
createNewFormatEmployee();
