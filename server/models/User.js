const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  permissions: {
    contacts: { create: Boolean, read: Boolean, update: Boolean, delete: Boolean, export: Boolean },
    donations: { create: Boolean, read: Boolean, update: Boolean, delete: Boolean, export: Boolean },
    organizations: { create: Boolean, read: Boolean, update: Boolean, delete: Boolean, export: Boolean },
    campaigns: { create: Boolean, read: Boolean, update: Boolean, delete: Boolean, export: Boolean },
    receipts: { create: Boolean, read: Boolean, update: Boolean, delete: Boolean, export: Boolean },
    users: { create: Boolean, read: Boolean, update: Boolean, delete: Boolean, export: Boolean }
  },
  manages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getPermissions = function() {
  const basePermissions = {
    dashboard: true,
    profile: true
  };

  if (this.role === 'admin') {
    return {
      ...basePermissions,
      contacts: true, organizations: true, agencies: true, channels: true,
      monthlyDonations: true, donations: true, payments: true, receipts: true,
      campaigns: true, journeys: true, reports: true, users: true, settings: true
    };
  }

  return {
    ...basePermissions,
    contacts: this.permissions?.contacts?.read || false,
    organizations: this.permissions?.organizations?.read || false,
    agencies: this.permissions?.agencies?.read || false,
    channels: this.permissions?.channels?.read || false,
    monthlyDonations: this.permissions?.donations?.read || false,
    donations: this.permissions?.donations?.read || false,
    payments: this.permissions?.payments?.read || false,
    receipts: this.permissions?.receipts?.read || false,
    campaigns: this.permissions?.campaigns?.read || false,
    journeys: this.permissions?.journeys?.read || false,
    reports: this.permissions?.reports?.read || false,
    users: this.permissions?.users?.read || false,
    settings: this.permissions?.settings?.read || false
  };
};

module.exports = mongoose.model('User', userSchema);
