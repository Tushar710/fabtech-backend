require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Branch = require('../models/Branch');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech';

async function getBranchCredentials() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const companyId = '68e63bfa6bc050bb4675c9a6';

    // Get all branches
    const branches = await Branch.find({ company: companyId, isActive: true })
      .select('name email phone branchCode password');

    console.log(`📊 Found ${branches.length} branches:\n`);

    branches.forEach(branch => {
      console.log(`🏢 Branch: ${branch.name}`);
      console.log(`   Email: ${branch.email}`);
      console.log(`   Branch Code: ${branch.branchCode}`);
      console.log(`   Phone: ${branch.phone}`);
      console.log(`   Password (hashed): ${branch.password ? 'SET' : 'NOT SET'}`);
      console.log(`   ID: ${branch._id}\n`);
    });

    console.log('\n📝 Login Instructions:');
    console.log('1. Go to login page');
    console.log('2. Select "Branch Login"');
    console.log('3. Use Branch Code or Email');
    console.log('4. Password: (check with admin or reset)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

getBranchCredentials();
