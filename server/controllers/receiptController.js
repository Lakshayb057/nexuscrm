const Donation = require('../models/Donation');
const { generatePDF, generateExcel } = require('../services/exportService');
const { getSettings } = require('../services/settingsService');

exports.getReceipts = async (req, res) => {
  try {
    const { page = 1, limit = 10, donor, donors, organization, status, type, fromDate, toDate, hasReceipt } = req.query;

    const query = {};
    if (donor) query.donor = donor;
    if (donors) query.donor = { $in: donors.split(',').filter(Boolean) };
    if (organization) query.organization = organization;
    if (status) query.status = status; // donation status
    if (type) query.type = type; // 'one-time' | 'monthly'
    if (fromDate || toDate) {
      query.donationDate = {};
      if (fromDate) query.donationDate.$gte = new Date(fromDate);
      if (toDate) query.donationDate.$lte = new Date(toDate);
    }
    if (hasReceipt === 'true') query.receiptStatus = 'generated';
    if (hasReceipt === 'false') query.receiptStatus = { $ne: 'generated' };

    // Non-admin scoping by organization
    if (req.user.role !== 'admin' && req.user.organization && !query.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const docs = await Donation.find(query)
      .populate('donor organization agency campaign')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ donationDate: -1 });
    const total = await Donation.countDocuments(query);

    res.status(200).json({ success: true, total, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function makeReceiptNumber(donation, prefix = '80G-') {
  const orgPart = donation.organization?.name ? donation.organization.name.replace(/\s+/g, '').slice(0, 6).toUpperCase() : 'ORG';
  const datePart = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${orgPart}-${datePart}-${rand}`;
}

exports.generateReceipts = async (req, res) => {
  try {
    const { ids, donors } = req.body; // ids: donation ids array; donors: donor ids array

    if ((!ids || !ids.length) && (!donors || !donors.length)) {
      return res.status(400).json({ success: false, message: 'Provide donation ids or donor ids to generate receipts' });
    }

    const query = {};
    if (ids && ids.length) query._id = { $in: ids };
    if (donors && donors.length) query.donor = { $in: donors };

    // scope non-admin
    if (req.user.role !== 'admin' && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const donations = await Donation.find(query).populate('organization');
    const settings = await getSettings();
    const prefix = settings?.receipt?.prefix || '80G-';
    if (!donations.length) return res.status(404).json({ success: false, message: 'No donations found to generate receipts' });

    const updates = [];
    for (const d of donations) {
      if (d.receiptStatus !== 'generated') {
        d.receiptStatus = 'generated';
        d.receiptNumber = makeReceiptNumber(d, prefix);
        d.receiptGeneratedOn = new Date();
        updates.push(d.save());
      }
    }
    await Promise.all(updates);

    res.status(200).json({ success: true, message: `Receipts generated for ${updates.length} donation(s)` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportReceipts = async (req, res) => {
  try {
    const { format = 'excel', ids } = req.query;

    const query = {};
    if (ids) {
      const list = ids.split(',').filter(Boolean);
      query._id = { $in: list };
    }

    if (req.user.role !== 'admin' && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const donations = await Donation.find(query).populate('donor organization agency campaign').sort({ donationDate: -1 });
    const settings = await getSettings();

    const columns = [
      { header: 'Donor', accessor: 'donorName' },
      { header: 'Date', accessor: 'date' },
      { header: 'Organization', accessor: 'organizationName' },
      { header: 'Agency', accessor: 'agencyName' },
      { header: 'Type', accessor: 'type' },
      { header: 'Amount', accessor: 'amount' },
      { header: '80G Receipt', accessor: 'receiptNumber' },
      { header: 'Status', accessor: 'receiptStatus' },
    ];

    const rows = donations.map(d => ({
      donorName: d.donor?.firstName ? `${d.donor.firstName} ${d.donor.lastName || ''}`.trim() : (d.donor?.name || ''),
      date: new Date(d.donationDate).toLocaleDateString('en-IN'),
      organizationName: d.organization?.name || '',
      agencyName: d.agency?.name || '',
      type: d.type,
      amount: d.amount,
      receiptNumber: d.receiptNumber || '',
      receiptStatus: d.receiptStatus || 'pending',
    }));

    const title = '80G Receipts';

    if (format === 'pdf') {
      const layout = settings?.receipt || {};
      const buffer = await generatePDF(rows, columns, title, layout);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=receipts.pdf');
      return res.end(buffer);
    } else {
      const buffer = await generateExcel(rows, columns, title);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=receipts.xlsx');
      return res.end(buffer);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
