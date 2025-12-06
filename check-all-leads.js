const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkAllLeads() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check total leads
    const totalLeads = await Lead.countDocuments();
    console.log(`📊 Total leads in database: ${totalLeads}`);
    
    // Check leads by companyId
    const leadsByCompany = await Lead.aggregate([
      {
        $group: {
          _id: '$companyId',
          count: { $sum: 1 },
          leads: { $push: { name: '$name', email: '$email', company: '$company' } }
        }
      }
    ]);
    
    console.log('\n📋 Leads by Company:');
    leadsByCompany.forEach(group => {
      console.log(`\nCompany ID: ${group._id || 'No Company ID'}`);
      console.log(`Count: ${group.count}`);
      group.leads.forEach(lead => {
        console.log(`  - ${lead.name} (${lead.email}) - ${lead.company}`);
      });
    });
    
    // Check leads without companyId
    const leadsWithoutCompany = await Lead.find({ 
      $or: [
        { companyId: { $exists: false } },
        { companyId: null },
        { companyId: '' }
      ]
    }).select('name email company companyId');
    
    console.log(`\n🔍 Leads without companyId: ${leadsWithoutCompany.length}`);
    leadsWithoutCompany.forEach(lead => {
      console.log(`  - ${lead.name} (${lead.email}) - Company: ${lead.company} - CompanyId: ${lead.companyId}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking leads:', error);
    process.exit(1);
  }
}

checkAllLeads();
