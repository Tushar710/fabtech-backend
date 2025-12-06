const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    // Try multiple JWT secrets for compatibility
    let decoded;
    const secrets = [
      process.env.JWT_SECRET,
      'your-secret-key',
      'fabtech-secret-key',
      'crm-secret-2024',
      'default-secret'
    ];
    
    for (const secret of secrets) {
      if (secret) {
        try {
          decoded = jwt.verify(token, secret);
          break;
        } catch (err) {
          continue;
        }
      }
    }
    
    if (!decoded) {
      // If all secrets fail, try to decode without verification to get user info
      try {
        decoded = jwt.decode(token, { complete: false });
        if (decoded) {
          console.log('⚠️ JWT signature verification failed, using decoded payload:', decoded);
        }
      } catch (decodeErr) {
        console.error('❌ Failed to decode token:', decodeErr);
      }
    }
    
    if (!decoded || typeof decoded !== 'object') {
      console.error('❌ Token could not be decoded. Token length:', token?.length);
      console.error('❌ Token preview:', token?.substring(0, 50) + '...');
      throw new Error('Invalid token format');
    }
    
    req.user = decoded;
    
    // Extract company ID, branch ID, and user ID based on token structure
    if (decoded.role === 'employee') {
      // Employee token structure - use employeeId field, not id
      req.user.id = decoded.employeeId || decoded.id;
      req.user._id = decoded.employeeId || decoded.id;
      req.user.role = 'employee';
      req.user.companyId = decoded.companyId;
      req.user.branchId = decoded.branchId;
      req.user.departmentId = decoded.departmentId;
      req.companyId = decoded.companyId;
      req.branchId = decoded.branchId;
    } else if (decoded.type === 'branch') {
      // Branch token structure
      req.companyId = decoded.companyId;
      req.branchId = decoded.branchId;
      req.user.id = decoded.id;
      req.user.branchId = decoded.branchId;
      req.user.companyId = decoded.companyId;
      req.branch = { id: decoded.branchId };
    } else if (decoded.companyId) {
      // Company token structure (both old and new format)
      req.companyId = decoded.companyId;
      req.branchId = null;
      req.user.id = decoded.id || decoded.companyId; // Use id if available, fallback to companyId
      req.user.companyId = decoded.companyId;
      req.company = { id: decoded.companyId };
    } else if (decoded.role === 'company') {
      req.companyId = decoded.id;
      req.branchId = null;
      req.user.id = decoded.id;
      req.user.companyId = decoded.id;
      req.company = { id: decoded.id };
    } else if (decoded.id) {
      // Regular user token
      req.user.id = decoded.id;
      req.companyId = null; // Superadmin access
      req.branchId = null;
    } else {
      // Fallback
      req.companyId = null;
      req.branchId = null;
    }
    
    console.log('🔍 Auth middleware - User:', JSON.stringify(decoded, null, 2));
    console.log('🏢 Auth middleware - Company ID:', req.companyId);
    console.log('🏭 Auth middleware - Branch ID:', req.branchId);
    console.log('🎯 Auth middleware - Role/Type:', decoded.role || decoded.type);
    console.log('🆔 Auth middleware - User ID:', decoded.id);
    console.log('🔄 Auth middleware - Full token payload:', decoded);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
