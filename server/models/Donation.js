const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: {
    type: String,
    unique: true,
    index: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  type: {
    type: String,
    enum: ['one-time', 'monthly'],
    required: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  lastDonationDate: {
    type: Date,
    default: Date.now
  },
  nextDonationDate: {
    type: Date,
    default: function() {
      if (this.type === 'monthly') {
        const nextDate = new Date(this.lastDonationDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        return nextDate;
      }
      return null;
    }
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount is required'],
    min: 1
  },
  currency: {
    type: String,
    default: 'INR'
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency'
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  donationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'bank_transfer', 'cash'],
    required: true
  },
  paymentReference: String,
  receiptStatus: {
    type: String,
    enum: ['pending', 'generated', 'failed'],
    default: 'pending'
  },
  receiptNumber: String,
  receiptGeneratedOn: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

donationSchema.index({ organization: 1, donationDate: -1 });

donationSchema.index({ donor: 1, donationDate: -1 });

// Pre-save hook to generate donorId if not provided
donationSchema.pre('save', async function(next) {
  if (this.isNew && !this.donorId) {
    const Donation = this.constructor;
    const prefix = this.type === 'monthly' ? 'SSMD' : 'SSOTD';
    
    try {
      // Find the highest existing donorId for this type
      const lastDonation = await Donation.findOne(
        { type: this.type, donorId: { $exists: true } },
        { donorId: 1 },
        { sort: { donorId: -1 } }
      ).exec();

      let nextSequence = 1000001; // Start from 1,000,001
      if (lastDonation && lastDonation.donorId) {
        // Extract the numeric part and increment
        const lastId = lastDonation.donorId;
        const lastSequence = parseInt(lastId.replace(/^[A-Za-z]+/, ''), 10) || 1000000;
        nextSequence = lastSequence + 1;
      }
      
      this.donorId = `${prefix}${nextSequence.toString().padStart(7, '0')}`;
    } catch (error) {
      console.error('Error generating donorId:', error);
      // Fallback to a simple timestamp-based ID if there's an error
      this.donorId = `${prefix}${Date.now().toString().slice(-7)}`;
    }
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema);
