const Organization = require('../models/Organization');
const { generatePDF, generateExcel } = require('../services/exportService');

// Ensure handlers are defined at module load time for router imports
exports.updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const status = body.g80Status;
    const update = {
      name: body.name,
      registrationNumber: body.registrationNumber,
      contactEmail: body.contactEmail,
      phone: body.phone,
      address: body.address,
      g80Status: status,
      website: body.website,
      description: body.description,
      isActive: body.isActive,
    };

    if (status === 'approved') {
      if (!body.g80Number) {
        return res.status(400).json({ success: false, message: '80G Certificate Number is required when status is Has 80G Certificate' });
      }
      update.g80Number = body.g80Number;
      update.g80ApplicationNumber = undefined;
    } else if (status === 'pending') {
      update.g80Number = undefined;
      update.g80ApplicationNumber = body.g80ApplicationNumber || undefined;
    } else if (status === 'rejected') {
      update.g80Number = undefined;
      update.g80ApplicationNumber = undefined;
    }

    const org = await Organization.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Organization name or registration number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await Organization.findByIdAndDelete(id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.status(200).json({ success: true, message: 'Organization deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Organization scoping: non-admins can only see their assigned organization
    if (req.user.role !== 'admin' && req.user.organization) {
      query._id = req.user.organization._id || req.user.organization;
    }

    const orgs = await Organization.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Organization.countDocuments(query);

    res.status(200).json({ success: true, total, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const body = req.body;

    // Normalize incoming 80G fields
    // Expecting g80Status one of: 'approved', 'pending', 'rejected'
    if (body.g80Status === 'approved' && !body.g80Number) {
      return res.status(400).json({ success: false, message: '80G Certificate Number is required when status is Has 80G Certificate' });
    }

    const status = body.g80Status || 'pending';
    const payload = {
      name: body.name,
      registrationNumber: body.registrationNumber,
      contactEmail: body.contactEmail,
      phone: body.phone,
      address: body.address || {},
      g80Status: status,
      createdBy: req.user._id,
    };

    if (status === 'approved') {
      payload.g80Number = body.g80Number; // required already enforced above  
      // ensure application number is not stored for approved
      payload.g80ApplicationNumber = undefined;
    } else if (status === 'pending') {
      // store application number when applied
      if (body.g80ApplicationNumber) {
        payload.g80ApplicationNumber = body.g80ApplicationNumber;
      }
      // do not store certificate number when not approved
      payload.g80Number = undefined;
    } else {
      // rejected: store neither certificate number nor application number
      payload.g80Number = undefined;
      payload.g80ApplicationNumber = undefined;
    }

    const org = await Organization.create(payload);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    if (error && error.code === 11000) {
      // Unique conflict on name or registrationNumber
      return res.status(400).json({ success: false, message: 'Organization name or registration number already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportOrganizations = async (req, res) => {
  try {
    const { format = 'excel', ids } = req.query;

    let query = {};
    if (ids) {
      const list = ids.split(',').filter(Boolean);
      query._id = { $in: list };
    }

    // Scoping for non-admins
    if (req.user.role !== 'admin' && req.user.organization) {
      query._id = req.user.organization._id || req.user.organization;
    }

    const orgs = await Organization.find(query).sort({ createdAt: -1 });

    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Registration #', accessor: 'registrationNumber' },
      { header: 'Email', accessor: 'contactEmail' },
      { header: 'Phone', accessor: 'phone' },
      { header: '80G Status', accessor: 'g80Status' },
      { header: '80G Number', accessor: 'g80Number' },
      { header: 'Application Number', accessor: 'g80ApplicationNumber' },
      { header: 'Address', accessor: 'addressStr' },
    ];

    const rows = orgs.map(o => ({
      name: o.name,
      registrationNumber: o.registrationNumber,
      contactEmail: o.contactEmail,
      phone: o.phone,
      g80Status: o.g80Status,
      g80Number: o.g80Number || '',
      g80ApplicationNumber: o.g80ApplicationNumber || '',
      addressStr: [o.address?.street, o.address?.city, o.address?.state, o.address?.zipCode, o.address?.country].filter(Boolean).join(', '),
    }));

    const title = 'Organizations';

    if (format === 'pdf') {
      const buffer = await generatePDF(rows, columns, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=organizations.pdf');
      return res.end(buffer);
    } else {
      const buffer = await generateExcel(rows, columns, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=organizations.xlsx');
      return res.end(buffer);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
