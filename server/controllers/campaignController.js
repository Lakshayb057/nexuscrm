const Campaign = require('../models/Campaign');
const { generatePDF, generateExcel } = require('../services/exportService');

exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, organization, channel, agency, status } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (organization) query.organization = organization;
    if (channel) query.channel = channel;
    if (agency) query.agency = agency;
    if (status) query.status = status;

    // Non-admin scoping: limit to their org
    if (req.user.role !== 'admin' && req.user.organization && !query.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const docs = await Campaign.find(query)
      .populate('organization', 'name')
      .populate('channel', 'name')
      .populate('agency', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Campaign.countDocuments(query);

    res.status(200).json({ success: true, total, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const body = req.body;

    const payload = {
      name: body.name,
      organization: body.organization,
      channel: body.channel,
      agency: body.agency,
      startDate: body.startDate,
      endDate: body.endDate,
      targetAmount: body.targetAmount || 0,
      status: body.status || 'Active',
      description: body.description || '',
      createdBy: req.user._id,
    };

    const doc = await Campaign.create(payload);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const update = {
      name: body.name,
      organization: body.organization,
      channel: body.channel,
      agency: body.agency,
      startDate: body.startDate,
      endDate: body.endDate,
      targetAmount: body.targetAmount,
      status: body.status,
      description: body.description,
    };

    const doc = await Campaign.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Campaign.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.status(200).json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportCampaigns = async (req, res) => {
  try {
    const { format = 'excel', ids } = req.query;

    const query = {};
    if (ids) {
      const list = ids.split(',').filter(Boolean);
      query._id = { $in: list };
    }

    const docs = await Campaign.find(query)
      .populate('organization', 'name')
      .populate('channel', 'name')
      .populate('agency', 'name')
      .sort({ createdAt: -1 });

    const columns = [
      { header: 'Campaign Name', accessor: 'name' },
      { header: 'Organization', accessor: 'organization' },
      { header: 'Channel', accessor: 'channel' },
      { header: 'Agency', accessor: 'agency' },
      { header: 'Start Date', accessor: 'startDate' },
      { header: 'End Date', accessor: 'endDate' },
      { header: 'Target Amount', accessor: 'targetAmount' },
      { header: 'Status', accessor: 'status' },
      { header: 'Description', accessor: 'description' },
    ];

    const rows = docs.map(d => ({
      name: d.name,
      organization: d.organization?.name || '',
      channel: d.channel?.name || '',
      agency: d.agency?.name || '',
      startDate: d.startDate ? new Date(d.startDate).toISOString().slice(0,10) : '',
      endDate: d.endDate ? new Date(d.endDate).toISOString().slice(0,10) : '',
      targetAmount: d.targetAmount ?? '',
      status: d.status,
      description: d.description || '',
    }));

    const title = 'Campaigns';

    if (format === 'pdf') {
      const buffer = await generatePDF(rows, columns, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=campaigns.pdf');
      return res.end(buffer);
    } else {
      const buffer = await generateExcel(rows, columns, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=campaigns.xlsx');
      return res.end(buffer);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
