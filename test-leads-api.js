const axios = require('axios');

async function testLeadsAPI() {
  try {
    console.log('🔍 Testing Leads API...\n');

    // You'll need to get a valid token first
    // For now, let's just test the endpoint structure
    const response = await axios.get('https://fabtech-backend.onrender.com/api/leads', {
      headers: {
        // Add your auth token here
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    console.log('✅ API Response received');
    console.log('Total leads:', response.data.leads?.length || 0);

    // Find Shrikant Kanade
    const shrikantLead = response.data.leads?.find(lead =>
      (lead.customerName || lead.name)?.toLowerCase().includes('shrikant')
    );

    if (shrikantLead) {
      console.log('\n👤 Shrikant Kanade Lead:');
      console.log('   Name:', shrikantLead.customerName || shrikantLead.name);
      console.log('   Status:', shrikantLead.status);
      console.log('   Has rejectedQuotation:', !!shrikantLead.rejectedQuotation);

      if (shrikantLead.rejectedQuotation) {
        console.log('\n📄 Rejected Quotation Data:');
        console.log('   Quotation Number:', shrikantLead.rejectedQuotation.quotationNumber);
        console.log('   Rejection Reason:', shrikantLead.rejectedQuotation.rejectionReason);
        console.log('   Rejected At:', shrikantLead.rejectedQuotation.rejectedAt);
      } else {
        console.log('\n❌ No rejectedQuotation data in API response!');
      }
    } else {
      console.log('\n❌ Shrikant Kanade lead not found in API response');
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication required');
      console.log('Please update the token in the script');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  }
}

testLeadsAPI();
