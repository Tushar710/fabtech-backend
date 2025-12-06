require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');
    console.log('📍 Database:', mongoose.connection.name);
    
    const Task = require('./models/Task');
    const Employee = require('./models/Employee');
    
    // Get all tasks
    const allTasks = await Task.find({});
    console.log('\n📊 ALL TASKS IN DATABASE:', allTasks.length);
    
    allTasks.forEach((task, i) => {
      console.log(`\n${i + 1}. "${task.title}"`);
      console.log(`   Assigned to ID: ${task.assignedTo}`);
      console.log(`   Assigned to Name: ${task.assignedToName}`);
      console.log(`   Company: ${task.companyId}`);
      console.log(`   Created by: ${task.createdBy}`);
    });
    
    // Get Tushar's employee record
    console.log('\n\n👤 TUSHAR PAWAR RECORDS:');
    const tushars = await Employee.find({ 
      $or: [
        { email: 'pawartushar@gmail.com' },
        { name: /Tushar/i }
      ]
    });
    
    tushars.forEach(emp => {
      console.log(`\nName: ${emp.name}`);
      console.log(`ID: ${emp._id}`);
      console.log(`Email: ${emp.email}`);
      console.log(`Company: ${emp.company}`);
      console.log(`Active: ${emp.isActive !== false}`);
    });
    
    // Check if orphan ID exists
    console.log('\n\n🔍 CHECKING ORPHAN ID: 692abdbf47c05c00a064c5a9');
    const orphanEmployee = await Employee.findById('692abdbf47c05c00a064c5a9');
    if (orphanEmployee) {
      console.log('❌ Orphan employee EXISTS:', orphanEmployee.name);
    } else {
      console.log('✅ Orphan employee does NOT exist');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
