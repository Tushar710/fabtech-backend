require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech';

async function setBranchPassword() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const branchId = '69134a4ff54324b947049ee3';
    const newPassword = 'branch123'; // Default password

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update branch
    await Branch.updateOne(
      { _id: branchId },
      { $set: { password: hashedPassword } }
    );

    console.log('✅ Branch password updated successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('   Branch Code: PUN2055');
    console.log('   Email: pawartushar710@gmail.com');
    console.log('   Password: branch123');
    console.log('\n🔐 Use these credentials to login as branch\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

setBranchPassword();
