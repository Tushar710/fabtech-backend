const mongoose = require('mongoose');
const Lead = require('../models/Lead');

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://sparkcomputer555_db_user:VNM2yzveqPtAc55u@cluster0.jaloiyh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function addTitleToExistingLeads() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Find all leads without title field
    const leadsWithoutTitle = await Lead.find({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' }
      ]
    });

    console.log(`Found ${leadsWithoutTitle.length} leads without title`);

    if (leadsWithoutTitle.length === 0) {
      console.log('All leads already have titles!');
      return;
    }

    // Update each lead with a generated title
    for (const lead of leadsWithoutTitle) {
      let generatedTitle = 'General Enquiry';
      
      if (lead.company && lead.name) {
        generatedTitle = `${lead.name} - ${lead.company}`;
      } else if (lead.company) {
        generatedTitle = `${lead.company} - Business Enquiry`;
      } else if (lead.name) {
        generatedTitle = `${lead.name} - Personal Enquiry`;
      }

      await Lead.findByIdAndUpdate(lead._id, {
        title: generatedTitle
      });

      console.log(`Updated lead ${lead._id}: "${generatedTitle}"`);
    }

    console.log(`Successfully updated ${leadsWithoutTitle.length} leads with titles`);

    // Verify the update
    const remainingLeadsWithoutTitle = await Lead.find({
      $or: [
        { title: { $exists: false } },
        { title: null },
        { title: '' }
      ]
    });

    console.log(`Remaining leads without title: ${remainingLeadsWithoutTitle.length}`);

  } catch (error) {
    console.error('Error updating leads:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
addTitleToExistingLeads();
