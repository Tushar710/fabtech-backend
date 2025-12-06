const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkSfCompany() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // First, let's see what company ID sf@gmail.com should have
    // We need to check the hosted auth server response for this user
    console.log('🔍 Checking for sf@gmail.com company...');
    
    // Check all leads and their company IDs
    const allLeads = await Lead.find({}).select('name email companyId company');
    
    console.log('\n📋 All leads in database:');
    allLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name} (${lead.email})`);
      console.log(`   Company ID: ${lead.companyId}`);
      console.log(`   Company Name: ${lead.company || 'Not specified'}`);
      console.log('');
    });
    
    // Check if there are leads without companyId that might belong to sf@gmail.com
    const leadsWithoutCompanyId = await Lead.find({
      $or: [
        { companyId: { $exists: false } },
        { companyId: null },
        { companyId: '' }
      ]
    });
    
    console.log(`\n🔍 Leads without companyId: ${leadsWithoutCompanyId.length}`);
    
    // Let's also check what company IDs exist
    const companyIds = await Lead.distinct('companyId');
    console.log('\n📊 Existing Company IDs in database:');
    companyIds.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('1. Login with sf@gmail.com and check console for JWT token');
    console.log('2. Look for company ID in the token');
    console.log('3. Create test leads for that company ID');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSfCompany();
