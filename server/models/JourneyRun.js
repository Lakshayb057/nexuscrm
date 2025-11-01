const mongoose = require('mongoose');

const JourneyRunSchema = new mongoose.Schema({
  journey: { type: mongoose.Schema.Types.ObjectId, ref: 'Journey', required: true },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'stopped', 'error'], default: 'pending' },
  currentNodeId: { type: String },
  scheduledAt: { type: Date },
  lastExecutedAt: { type: Date },
  context: { type: Object, default: {} },
  history: [{
    nodeId: String,
    nodeType: String,
    executedAt: Date,
    result: Object,
  }],
}, { timestamps: true });

module.exports = mongoose.model('JourneyRun', JourneyRunSchema);
