const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  targetAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Upcoming', 'Completed'], default: 'Active' },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);
