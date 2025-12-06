const jwt = require('jsonwebtoken');

// Test JWT token decoding to see what company ID sf@gmail.com has
// You'll need to paste the actual JWT token from browser console here

function debugToken() {
  console.log('🔍 JWT Token Debug Tool');
  console.log('='.repeat(50));
  
  // Placeholder - replace with actual token from browser console
  const sampleToken = 'PASTE_JWT_TOKEN_HERE';
  
  if (sampleToken === 'PASTE_JWT_TOKEN_HERE') {
    console.log('⚠️  Please paste the actual JWT token from browser console');
    console.log('');
    console.log('Steps:');
    console.log('1. Login with sf@gmail.com');
    console.log('2. Open browser console (F12)');
    console.log('3. Look for "Auth middleware - User:" log');
    console.log('4. Copy the JWT token');
    console.log('5. Replace PASTE_JWT_TOKEN_HERE in this file');
    console.log('6. Run: node debug-sf-token.js');
    return;
  }
  
  try {
    const decoded = jwt.decode(sampleToken);
    console.log('📋 Decoded JWT Token:');
    console.log(JSON.stringify(decoded, null, 2));
    
    let companyId = null;
    if (decoded.role === 'company') {
      companyId = decoded.id;
    } else if (decoded.companyId) {
      companyId = decoded.companyId;
    }
    
    console.log('\n🏢 Extracted Company ID:', companyId);
    
    if (companyId) {
      console.log('\n✅ Next step: Update leads with this company ID');
      console.log(`Run: node update-sf-leads.js ${companyId}`);
    }
    
  } catch (error) {
    console.error('❌ Error decoding token:', error);
  }
}

debugToken();
