// Test script to verify Task API endpoints
const mongoose = require('mongoose');
require('dotenv').config();

async function testTaskModel() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech');
    console.log('✅ Connected to MongoDB');

    const Task = require('./models/Task');
    console.log('✅ Task model loaded successfully');
    
    // Check if tasks collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const taskCollection = collections.find(c => c.name === 'tasks');
    
    if (taskCollection) {
      const count = await Task.countDocuments();
      console.log(`✅ Tasks collection exists with ${count} documents`);
    } else {
      console.log('ℹ️  Tasks collection will be created on first insert');
    }

    await mongoose.connection.close();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTaskModel();
