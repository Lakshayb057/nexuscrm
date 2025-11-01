const Contact = require('../models/Contact');
const Organization = require('../models/Organization');

exports.getContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, organization, search, type, status } = req.query;
    
    let query = {};
    
    // Organization scoping: non-admins are limited to their assigned organization
    if (req.user.role !== 'admin') {
      if (req.user.organization) {
        query.organization = req.user.organization._id || req.user.organization;
      } else {
        return res.status(403).json({ success: false, message: 'Organization access is required' });
      }
    } else if (organization && organization !== 'all') {
      query.organization = organization;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type === 'pledge') {
      query.isActiveMonthlyDonor = true;
    } else if (type === 'onetime') {
      query.isOneTimeDonor = true;
    } else if (type === 'prospect') {
      query.isActiveMonthlyDonor = false;
      query.isOneTimeDonor = false;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const contacts = await Contact.find(query)
      .populate('organization')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('organization');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Organization scoping: ensure non-admin cannot access other orgs
    if (req.user.role !== 'admin') {
      const userOrgId = (req.user.organization && req.user.organization._id?.toString()) || req.user.organization?.toString();
      const contactOrgId = contact.organization?._id?.toString();
      if (userOrgId && contactOrgId && userOrgId !== contactOrgId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createContact = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    // Organization scoping: non-admins can only create under their org
    if (req.user.role !== 'admin') {
      if (!req.user.organization) {
        return res.status(403).json({ success: false, message: 'Organization access is required' });
      }
      req.body.organization = req.user.organization._id || req.user.organization;
    }
    
    const contact = await Contact.create(req.body);

    await contact.populate('organization');

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateContact = async (req, res, next) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Organization scoping: non-admins cannot update other orgs
    if (req.user.role !== 'admin') {
      const userOrgId = (req.user.organization && req.user.organization._id?.toString()) || req.user.organization?.toString();
      const contactOrgId = contact.organization?.toString();
      if (userOrgId && contactOrgId && userOrgId !== contactOrgId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      // Prevent changing organization via update by non-admins
      if (req.body.organization) delete req.body.organization;
    }

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('organization');

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Organization scoping: non-admins cannot delete other orgs
    if (req.user.role !== 'admin') {
      const userOrgId = (req.user.organization && req.user.organization._id?.toString()) || req.user.organization?.toString();
      const contactOrgId = contact.organization?.toString();
      if (userOrgId && contactOrgId && userOrgId !== contactOrgId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.exportContacts = async (req, res, next) => {
  try {
    const { format = 'excel', organization, type, status } = req.query;
    
    let query = {};
    
    if (organization && organization !== 'all') {
      query.organization = organization;
    }
    
    const contacts = await Contact.find(query)
      .populate('organization')
      .sort({ createdAt: -1 });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.pdf');
      res.end();
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
      res.end();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
