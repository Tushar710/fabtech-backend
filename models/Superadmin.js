const mongoose = require('mongoose');

// Schema for existing superadmins collection
const superadminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'superadmin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'superadmins' // Use existing collection name
});

// Method to compare password (for existing hashed passwords)
superadminSchema.methods.comparePassword = async function(candidatePassword) {
  // For existing superadmins, the password might already be hashed
  // Try direct comparison first, then bcrypt
  if (this.password === candidatePassword) {
    return true;
  }
  
  try {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Remove password from JSON output
superadminSchema.methods.toJSON = function() {
  const superadmin = this.toObject();
  delete superadmin.password;
  return superadmin;
};

module.exports = mongoose.model('Superadmin', superadminSchema);
