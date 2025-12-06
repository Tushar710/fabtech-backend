const mongoose = require('mongoose');
const Lead = require('./models/Lead');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function createSfCompanyLeads() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // We need to get the actual company ID for sf@gmail.com
    // For now, let's create a placeholder company ID
    // You'll need to replace this with the actual company ID from JWT token
    const sfCompanyId = '68be7d25009bf9b0bbb96e15'; // Placeholder - will update after seeing JWT
    
    // Create test leads for sf@gmail.com company
    const sfLeads = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
        company: 'ABC Corporation',
        source: 'website',
        status: 'new',
        priority: 'medium',
        value: 50000,
        notes: 'Interested in our premium package',
        companyId: sfCompanyId,
        userId: null,
        createdAt: new Date(),
        lastContact: new Date()
      },
      {
        name: 'Sarah Smith',
        email: 'sarah.smith@techcorp.com',
        phone: '+91 9876543211',
        company: 'TechCorp Solutions',
        source: 'referral',
        status: 'contacted',
        priority: 'high',
        value: 75000,
        notes: 'Follow up scheduled for next week',
        companyId: sfCompanyId,
        userId: null,
        createdAt: new Date(),
        lastContact: new Date()
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@startup.io',
        phone: '+91 9876543212',
        company: 'Startup Innovations',
        source: 'social_media',
        status: 'qualified',
        priority: 'medium',
        value: 30000,
        notes: 'Budget confirmed, ready to proceed',
        companyId: sfCompanyId,
        userId: null,
        createdAt: new Date(),
        lastContact: new Date()
      }
    ];
    
    // Insert the leads
    const createdLeads = await Lead.insertMany(sfLeads);
    
    console.log(`✅ Created ${createdLeads.length} leads for sf@gmail.com company`);
    console.log(`📊 Company ID used: ${sfCompanyId}`);
    
    // Verify the leads were created
    const companyLeads = await Lead.find({ companyId: sfCompanyId });
    console.log(`\n📋 Leads for sf@gmail.com company:`);
    companyLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name} (${lead.email}) - ${lead.status}`);
    });
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('1. Login with sf@gmail.com and check the JWT token in console');
    console.log('2. Find the actual company ID in the token');
    console.log('3. If different from the placeholder, update the leads with correct company ID');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSfCompanyLeads();
