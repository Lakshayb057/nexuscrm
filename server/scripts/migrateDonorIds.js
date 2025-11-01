const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexuscrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Donation = require('../models/Donation');

async function migrateDonorIds() {
  try {
    console.log('Starting donor ID migration...');
    
    // Get all donations without a donorId, sorted by creation date
    const donations = await Donation.find({ donorId: { $exists: false } }).sort({ createdAt: 1 });
    
    console.log(`Found ${donations.length} donations to update`);
    
    let monthlyCount = 1000000; // Start from 1,000,000
    let oneTimeCount = 1000000; // Start from 1,000,000
    
    for (const donation of donations) {
      try {
        let donorId;
        
        if (donation.type === 'monthly') {
          monthlyCount++;
          donorId = `SSMD${monthlyCount.toString().padStart(7, '0')}`;
        } else {
          oneTimeCount++;
          donorId = `SSOTD${oneTimeCount.toString().padStart(7, '0')}`;
        }
        
        // Update the donation with the new donorId
        await Donation.updateOne(
          { _id: donation._id },
          { $set: { donorId } }
        );
        
        console.log(`Updated donation ${donation._id} with donorId: ${donorId}`);
      } catch (error) {
        console.error(`Error updating donation ${donation._id}:`, error.message);
      }
    }
    
    console.log('Donor ID migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDonorIds();
