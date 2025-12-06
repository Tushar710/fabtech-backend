const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from backend-files directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Lead = require('../models/Lead');

async function checkLeadAssignment() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lead-management';
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the lead that was just assigned
    const leadId = '691da938525c60f0973594c3';
    const branchId = '69134a4ff54324b947049ee3';

    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      console.log('❌ Lead not found');
      return;
    }

    console.log('\n📋 Lead Details:');
    console.log('Lead ID:', lead._id);
    console.log('Customer Name:', lead.customerName);
    console.log('Assigned Branch:', lead.assignedBranch);
    console.log('Assigned Branch Name:', lead.assignedBranchName);
    console.log('Company:', lead.company);
    console.log('Assignment Date:', lead.assignmentDate);
    console.log('Assignment Notes:', lead.assignmentNotes);
    console.log('Priority:', lead.priority);
    
    console.log('\n🔍 Checking if branch ID matches:');
    console.log('Expected Branch ID:', branchId);
    console.log('Actual Branch ID:', lead.assignedBranch?.toString());
    console.log('Match:', lead.assignedBranch?.toString() === branchId);

    // Check all leads assigned to this branch
    console.log('\n📊 All leads assigned to this branch:');
    const branchLeads = await Lead.find({ assignedBranch: branchId });
    console.log(`Found ${branchLeads.length} leads`);
    
    branchLeads.forEach((l, i) => {
      console.log(`${i + 1}. ${l.customerName} - ${l._id} - Company: ${l.company}`);
    });

    // Check with company filter too
    const companyId = lead.company;
    if (companyId) {
      console.log('\n📊 Leads assigned to this branch with company filter:');
      const branchLeadsWithCompany = await Lead.find({ 
        assignedBranch: branchId,
        company: companyId
      });
      console.log(`Found ${branchLeadsWithCompany.length} leads`);
      
      branchLeadsWithCompany.forEach((l, i) => {
        console.log(`${i + 1}. ${l.customerName} - ${l._id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkLeadAssignment();
