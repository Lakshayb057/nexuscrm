const mongoose = require('mongoose');

const JourneySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  description: { type: String, default: '' },
  nodes: { type: Array, default: [] }, // [{ id, type, x, y, data }]
  edges: { type: Array, default: [] }, // [{ id, from, to }]
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Journey', JourneySchema);
