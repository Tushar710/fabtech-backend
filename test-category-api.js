require('dotenv').config();
const axios = require('axios');

const testCategoryAPI = async () => {
  try {
    console.log('🧪 Testing Product Category API...\n');

    // Get token from localStorage (you'll need to paste your actual token here)
    const token = process.argv[2];

    if (!token) {
      console.log('❌ Please provide token as argument:');
      console.log('   node test-category-api.js YOUR_TOKEN_HERE\n');
      console.log('💡 To get your token:');
      console.log('   1. Open browser console (F12)');
      console.log('   2. Type: localStorage.getItem("companyToken")');
      console.log('   3. Copy the token and run this script again\n');
      process.exit(1);
    }

    const API_URL = 'https://fabtech-backend.onrender.com/api';

    console.log('📡 Testing endpoint: GET /api/product-categories/type/Trading');
    console.log('🔑 Token length:', token.length);
    console.log('');

    const response = await axios.get(`${API_URL}/product-categories/type/Trading`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Categories found:', response.data.data?.length || 0);
    console.log('');

    if (response.data.data && response.data.data.length > 0) {
      console.log('📦 Categories:');
      response.data.data.forEach(cat => {
        console.log(`   ✅ ${cat.name}`);
        console.log(`      Type: ${cat.type}`);
        console.log(`      Sub-categories: ${cat.subCategories?.length || 0}`);
        if (cat.subCategories && cat.subCategories.length > 0) {
          cat.subCategories.forEach(sub => {
            console.log(`         - ${sub.name} (${sub.specifications?.length || 0} specs)`);
          });
        }
        console.log('');
      });
    } else {
      console.log('⚠️  No categories found!');
      console.log('   Run: node setup-trading-products.js');
    }

  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if backend server is running');
    console.log('   2. Verify token is valid');
    console.log('   3. Check if categories exist in database');
    console.log('   4. Run: node test-product-setup.js');
  }
};

testCategoryAPI();
