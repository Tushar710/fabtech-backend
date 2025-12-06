const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function updateSfLeads() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get the company ID from command line argument
    const newCompanyId = process.argv[2];
    
    if (!newCompanyId) {
      console.log('❌ Please provide company ID as argument');
      console.log('Usage: node update-sf-leads.js COMPANY_ID');
      process.exit(1);
    }
    
    console.log(`🔄 Updating leads for company ID: ${newCompanyId}`);
    
    // Update leads from placeholder company ID to actual company ID
    const oldCompanyId = '68be7d25009bf9b0bbb96e15'; // Placeholder ID used earlier
    
    const result = await Lead.updateMany(
      { companyId: oldCompanyId },
      { companyId: newCompanyId }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} leads`);
    
    // Verify the update
    const updatedLeads = await Lead.find({ companyId: newCompanyId });
    console.log(`\n📋 Leads for company ${newCompanyId}:`);
    updatedLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name} (${lead.email}) - ${lead.status}`);
    });
    
    console.log('\n🎉 sf@gmail.com company should now see leads!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateSfLeads();
