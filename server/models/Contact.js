const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  title: {
    type: String,
    enum: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', ''],
    default: ''
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  dateOfBirth: Date,
  preferredLanguage: {
    type: String,
    enum: ['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Other'],
    default: 'English'
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    default: 'Prefer not to say'
  },
  profession: String,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  firstDonationSource: {
    type: String,
    enum: ['Website', 'Social Media', 'Event', 'Referral', 'Other']
  },
  optInEmail: {
    type: Boolean,
    default: false
  },
  optInWhatsApp: {
    type: Boolean,
    default: false
  },
  isActiveMonthlyDonor: {
    type: Boolean,
    default: false
  },
  isOneTimeDonor: {
    type: Boolean,
    default: false
  },
  totalPaidAmount: {
    type: Number,
    default: 0
  },
  lastSuccessfulPaymentDate: Date,
  lastFailedPaymentDate: Date,
  lastFailedDonationSource: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure email is unique across contacts when provided (allow multiple docs without email)
contactSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $ne: '' } } }
);

// Ensure mobile is globally unique
contactSchema.index({ mobile: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);
