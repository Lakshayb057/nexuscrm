const Agency = require('../models/Agency');
const Organization = require('../models/Organization');
const { generatePDF, generateExcel } = require('../services/exportService');

exports.getAgencies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, organization } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (organization) query.organization = organization;

    // Non-admins limited to their organization
    if (req.user.role !== 'admin' && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const agencies = await Agency.find(query)
      .populate('organization')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Agency.countDocuments(query);

    res.status(200).json({ success: true, total, data: agencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAgency = async (req, res) => {
  try {
    const body = req.body;

    const payload = {
      name: body.name,
      organization: body.organization,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      commissionPercentage: body.commissionPercentage,
      address: body.address || {},
      isActive: body.isActive !== false,
      createdBy: req.user._id,
    };

    if (!payload.name || !payload.organization || !payload.contactPerson || !payload.phone) {
      return res.status(400).json({ success: false, message: 'Name, Organization, Contact Person and Phone are required' });
    }

    const agency = await Agency.create(payload);
    await agency.populate('organization');
    res.status(201).json({ success: true, data: agency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const update = {
      name: body.name,
      organization: body.organization,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      commissionPercentage: body.commissionPercentage,
      address: body.address,
      isActive: body.isActive,
    };

    const agency = await Agency.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate('organization');
    if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });
    res.status(200).json({ success: true, data: agency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const agency = await Agency.findByIdAndDelete(id);
    if (!agency) return res.status(404).json({ success: false, message: 'Agency not found' });
    res.status(200).json({ success: true, message: 'Agency deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportAgencies = async (req, res) => {
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

    const agencies = await Agency.find(query).populate('organization').sort({ createdAt: -1 });

    const columns = [
      { header: 'Agency Name', accessor: 'name' },
      { header: 'Organization', accessor: 'organizationName' },
      { header: 'Contact Person', accessor: 'contactPerson' },
      { header: 'Email', accessor: 'email' },
      { header: 'Phone', accessor: 'phone' },
      { header: 'Commission %', accessor: 'commissionPercentage' },
      { header: 'Address', accessor: 'addressStr' },
    ];

    const rows = agencies.map(a => ({
      name: a.name,
      organizationName: a.organization?.name || '',
      contactPerson: a.contactPerson,
      email: a.email || '',
      phone: a.phone,
      commissionPercentage: a.commissionPercentage ?? 0,
      addressStr: [a.address?.street, a.address?.city, a.address?.state, a.address?.zipCode, a.address?.country].filter(Boolean).join(', '),
    }));

    const title = 'Agencies';

    if (format === 'pdf') {
      const buffer = await generatePDF(rows, columns, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=agencies.pdf');
      return res.end(buffer);
    } else {
      const buffer = await generateExcel(rows, columns, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=agencies.xlsx');
      return res.end(buffer);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
