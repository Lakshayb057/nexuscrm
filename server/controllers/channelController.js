const Channel = require('../models/Channel');
const { generatePDF, generateExcel } = require('../services/exportService');

exports.getChannels = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, organization, type, status } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (organization) query.organization = organization;
    if (type) query.type = type;
    if (status) query.status = status;

    if (req.user.role !== 'admin' && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const channels = await Channel.find(query)
      .populate('organization')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Channel.countDocuments(query);

    res.status(200).json({ success: true, total, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createChannel = async (req, res) => {
  try {
    const body = req.body;

    const payload = {
      name: body.name,
      organization: body.organization,
      type: body.type,
      status: body.status || 'active',
      description: body.description,
      isActive: body.status === 'active',
      createdBy: req.user._id,
    };

    if (!payload.name || !payload.organization || !payload.type || !payload.status) {
      return res.status(400).json({ success: false, message: 'Name, Organization, Channel Type and Status are required' });
    }

    const channel = await Channel.create(payload);
    await channel.populate('organization');
    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const update = {
      name: body.name,
      organization: body.organization,
      type: body.type,
      status: body.status,
      description: body.description,
      isActive: body.status === 'active',
    };

    const channel = await Channel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate('organization');
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });
    res.status(200).json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await Channel.findByIdAndDelete(id);
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });
    res.status(200).json({ success: true, message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportChannels = async (req, res) => {
  try {
    const { format = 'excel', ids } = req.query;

    let query = {};
    if (ids) {
      const list = ids.split(',').filter(Boolean);
      query._id = { $in: list };
    }

    if (req.user.role !== 'admin' && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const channels = await Channel.find(query).populate('organization').sort({ createdAt: -1 });

    const columns = [
      { header: 'Channel Name', accessor: 'name' },
      { header: 'Organization', accessor: 'organizationName' },
      { header: 'Type', accessor: 'type' },
      { header: 'Status', accessor: 'status' },
      { header: 'Description', accessor: 'description' },
    ];

    const rows = channels.map(c => ({
      name: c.name,
      organizationName: c.organization?.name || '',
      type: c.type,
      status: c.status,
      description: c.description || '',
    }));

    const title = 'Channels';

    if (format === 'pdf') {
      const buffer = await generatePDF(rows, columns, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=channels.pdf');
      return res.end(buffer);
    } else {
      const buffer = await generateExcel(rows, columns, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=channels.xlsx');
      return res.end(buffer);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
