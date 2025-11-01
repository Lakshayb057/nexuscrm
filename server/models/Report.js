const mongoose = require('mongoose');

const ReportComponentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  kind: { type: String, enum: ['table', 'bar', 'pie', 'line'], default: 'table' },
  title: { type: String, default: '' },
  queryKey: { type: String, default: '' }, // e.g., donation_summary_by_month
  groupBy: { type: String, default: '' }, // e.g., month, campaign, organization, city
  metrics: { type: Array, default: [] }, // e.g., ['sumAmount','count']
  sort: { type: Object, default: {} },
}, { _id: false });

const ReportSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['donation', 'donor', 'campaign', 'financial'], required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  filters: { type: Object, default: {} }, // { dateFrom, dateTo, campaignId, donorType, paymentMethod, search }
  fields: { type: [String], default: [] },
  components: { type: [ReportComponentSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
