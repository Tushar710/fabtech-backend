const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function updateLeadsWithCompanyId() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Update all existing leads to have the company ID from the logged-in user
    const companyId = '68babac58ab96e9658ba62a0'; // Your company ID from JWT token
    
    const result = await Lead.updateMany(
      { companyId: { $exists: false } }, // Only update leads that don't have companyId
      { $set: { companyId: companyId } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} leads with companyId: ${companyId}`);
    
    // Verify the update
    const leadsWithCompanyId = await Lead.countDocuments({ companyId: companyId });
    console.log(`📊 Total leads for company ${companyId}: ${leadsWithCompanyId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating leads:', error);
    process.exit(1);
  }
}

updateLeadsWithCompanyId();
