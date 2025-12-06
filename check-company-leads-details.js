const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function getCompanyLeadsDetails() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get detailed breakdown by company
    const leadsByCompany = await Lead.aggregate([
      {
        $group: {
          _id: '$companyId',
          count: { $sum: 1 },
          leads: { 
            $push: { 
              name: '$name', 
              email: '$email', 
              company: '$company',
              status: '$status',
              createdAt: '$createdAt'
            } 
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('\n📊 Company-wise Lead Distribution:');
    console.log('='.repeat(50));
    
    leadsByCompany.forEach((group, index) => {
      const companyName = getCompanyName(group._id);
      console.log(`\n${index + 1}. ${companyName}`);
      console.log(`   Company ID: ${group._id}`);
      console.log(`   Total Leads: ${group.count}`);
      console.log('   Lead Details:');
      
      group.leads.forEach((lead, leadIndex) => {
        const createdDate = new Date(lead.createdAt).toLocaleDateString('en-IN');
        console.log(`     ${leadIndex + 1}. ${lead.name} (${lead.email})`);
        console.log(`        Company: ${lead.company || 'Not specified'}`);
        console.log(`        Status: ${lead.status || 'new'}`);
        console.log(`        Created: ${createdDate}`);
        console.log('');
      });
    });
    
    // Summary
    const totalLeads = await Lead.countDocuments();
    console.log('\n📈 Summary:');
    console.log(`Total Companies: ${leadsByCompany.length}`);
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`Average Leads per Company: ${(totalLeads / leadsByCompany.length).toFixed(1)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function getCompanyName(companyId) {
  // Map known company IDs to names
  const companyNames = {
    '68babac58ab96e9658ba62a0': 'Infoyashonanad (Your Company)',
    '68be7d25009bf9b0bbb96e14': 'Other Company'
  };
  
  return companyNames[companyId] || `Company (${companyId})`;
}

getCompanyLeadsDetails();
