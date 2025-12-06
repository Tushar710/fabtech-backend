// Manual Database Update Script
// Run this in MongoDB Compass or MongoDB shell

// Update existing form fields to add companyId
db.formfields.updateMany(
  { companyId: { $exists: false } },
  { 
    $set: { 
      companyId: ObjectId("68babac58ab96e9658ba62a0"),
      updatedAt: new Date()
    }
  }
);

// Verify the update
db.formfields.find({}).forEach(function(doc) {
  print("Field: " + doc.name + " -> Company: " + doc.companyId);
});

// Check count
print("Total fields updated: " + db.formfields.countDocuments({ companyId: { $exists: true } }));
