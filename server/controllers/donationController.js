const Donation = require('../models/Donation');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { exportToExcel } = require('../utils/excelExport');
// Using native Date instead of moment

exports.getDonations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status, organization, donor, campaign, agency, channel, fromDate, toDate } = req.query;

    const query = {};
    if (type) query.type = type; // 'one-time' | 'monthly'
    if (status) query.status = status;
    if (organization) query.organization = organization;
    if (donor) query.donor = donor;
    if (campaign) query.campaign = campaign;
    if (agency) query.agency = agency;
    if (channel) query.channel = channel;
    if (fromDate || toDate) {
      query.donationDate = {};
      if (fromDate) query.donationDate.$gte = new Date(fromDate);
      if (toDate) query.donationDate.$lte = new Date(toDate);
    }

    if (search) {
      // simple search on paymentReference
      query.$or = [{ paymentReference: { $regex: search, $options: 'i' } }];
    }

    // Non-admin scoping: limit to their org
    if (req.user.role !== 'admin' && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const donations = await Donation.find(query)
      .populate('donor organization campaign agency channel')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ donationDate: -1 });
    const total = await Donation.countDocuments(query);

    res.status(200).json({ success: true, total, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyDonationStatus = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  // Set time to start of day for accurate date comparison
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const donations = await Donation.find({
    type: 'monthly',
    subscriptionStatus: 'active',
    nextDonationDate: { 
      $lte: sevenDaysFromNow,
      $gte: startOfToday
    },
    status: 'completed'
  })
  .populate('donor', 'name email phone')
  .populate('organization', 'name')
  .sort({ nextDonationDate: 1 });

  res.status(200).json({
    success: true,
    count: donations.length,
    data: donations
  });
});

exports.createDonation = async (req, res) => {
  try {
    const body = req.body;
    const payload = {
      donor: body.donor,
      organization: body.organization,
      type: body.type,
      amount: body.amount,
      currency: body.currency || 'INR',
      campaign: body.campaign,
      agency: body.agency,
      channel: body.channel,
      donationDate: body.donationDate || new Date(),
      status: body.status || 'pending',
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
      createdBy: req.user._id,
    };

    // If campaign is provided but not a valid ObjectId, drop it to avoid cast error
    if (payload.campaign && !/^[a-fA-F0-9]{24}$/.test(String(payload.campaign))) {
      delete payload.campaign;
    }

    // Enforce organization for non-admins
    if (req.user.role !== 'admin') {
      if (!req.user.organization) {
        return res.status(403).json({ success: false, message: 'Organization access is required' });
      }
      payload.organization = req.user.organization._id || req.user.organization;
    }

    if (!payload.donor || !payload.organization || !payload.type || !payload.amount || !payload.paymentMethod) {
      return res.status(400).json({ success: false, message: 'Donor, Organization, Type, Amount and Payment Method are required' });
    }

    const donation = await Donation.create(payload);
    await donation.populate('donor organization campaign agency channel');
    res.status(201).json({ success: true, data: donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const update = {
      donor: body.donor,
      organization: body.organization,
      type: body.type,
      amount: body.amount,
      currency: body.currency,
      campaign: body.campaign,
      agency: body.agency,
      channel: body.channel,
      donationDate: body.donationDate,
      status: body.status,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
    };

    if (update.campaign && !/^[a-fA-F0-9]{24}$/.test(String(update.campaign))) {
      delete update.campaign;
    }

    // Load donation first to enforce org access for non-admins
    const existing = await Donation.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (req.user.role !== 'admin') {
      const userOrgId = (req.user.organization && req.user.organization._id?.toString()) || req.user.organization?.toString();
      const docOrgId = existing.organization?.toString();
      if (userOrgId && docOrgId && userOrgId !== docOrgId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      // Prevent changing organization by non-admins
      if (update.organization) delete update.organization;
    }

    const donation = await Donation.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate('donor organization campaign agency channel');
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    res.status(200).json({ success: true, data: donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    if (req.user.role !== 'admin') {
      const userOrgId = (req.user.organization && req.user.organization._id?.toString()) || req.user.organization?.toString();
      const docOrgId = donation.organization?.toString();
      if (userOrgId && docOrgId && userOrgId !== docOrgId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }
    await Donation.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Donation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportDonations = async (req, res) => {
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

    const donations = await Donation.find(query).populate('donor organization campaign agency channel').sort({ donationDate: -1 });

    const columns = [
      { header: 'Donor', accessor: 'donorName' },
      { header: 'Date', accessor: 'date' },
      { header: 'Organization', accessor: 'organizationName' },
      { header: 'Agency', accessor: 'agencyName' },
      { header: 'Campaign', accessor: 'campaignName' },
      { header: 'Amount', accessor: 'amount' },
      { header: 'Type', accessor: 'type' },
      { header: 'Status', accessor: 'status' },
      { header: 'Method', accessor: 'paymentMethod' },
      { header: 'Reference', accessor: 'paymentReference' },
    ];

    const rows = donations.map(d => ({
      donorName: d.donor?.firstName ? `${d.donor.firstName} ${d.donor.lastName || ''}`.trim() : (d.donor?.name || ''),
      date: new Date(d.donationDate).toLocaleDateString('en-IN'),
      organizationName: d.organization?.name || '',
      agencyName: d.agency?.name || '',
      campaignName: d.campaign?.name || '',
      amount: d.amount,
      type: d.type,
      status: d.status,
      paymentMethod: d.paymentMethod,
      paymentReference: d.paymentReference || '',
    }));

    const title = 'Donations';

    if (format === 'pdf') {
      const buffer = await generatePDF(rows, columns, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=donations.pdf');
      return res.end(buffer);
    } else {
      const buffer = await generateExcel(rows, columns, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=donations.xlsx');
      return res.end(buffer);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update subscription status
// @route   PUT /api/v1/donations/:id/subscription
// @access  Private
exports.updateSubscriptionStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  // Validate status
  if (!['active', 'paused', 'cancelled'].includes(status)) {
    return next(new ErrorResponse('Invalid status. Must be one of: active, paused, cancelled', 400));
  }

  // Find the donation
  let donation = await Donation.findById(req.params.id)
    .populate('donor', 'name email phone')
    .populate('organization', 'name');

  if (!donation) {
    return next(new ErrorResponse(`Donation not found with id of ${req.params.id}`, 404));
  }

  // Check if user is authorized
  if (donation.donor._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this subscription', 401));
  }

  // Update subscription status
  donation.subscriptionStatus = status;
  
  // If reactivating, update next donation date
  if (status === 'active' && donation.type === 'monthly') {
    donation.nextDonationDate = new Date();
    donation.nextDonationDate.setMonth(donation.nextDonationDate.getMonth() + 1);
  }

  // Save the updated donation
  await donation.save();

  res.status(200).json({
    success: true,
    data: donation
  });
});

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, fromDate, toDate } = req.query;
    const query = { status: 'completed' };
    if (fromDate || toDate) {
      query.donationDate = {};
      if (fromDate) query.donationDate.$gte = new Date(fromDate);
      if (toDate) query.donationDate.$lte = new Date(toDate);
    }

    if (req.user.role !== 'admin' && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const payments = await Donation.find(query)
      .populate('donor organization campaign agency channel')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ donationDate: -1 });
    const total = await Donation.countDocuments(query);

    res.status(200).json({ success: true, total, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
