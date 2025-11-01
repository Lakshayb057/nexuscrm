const Report = require('../models/Report');
const Donation = require('../models/Donation');
const Organization = require('../models/Organization');
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');
// reportService optional; not used in current implementation

function buildScopeQuery(req, base = {}) {
  const q = { ...base };
  if (req.user.role !== 'admin' && req.user.organization && !q.organization) {
    q.organization = req.user.organization._id || req.user.organization;
  }
  return q;
}

async function runDonorComponent(component, filters, req) {
  const match = buildDonationMatch(filters, req);
  const pipeline = [ { $match: match } ];
  // join donor/contact if donation stores contact reference as donor/contact field
  const contactField = 'donor';
  pipeline.push({ $lookup: { from: 'contacts', localField: contactField, foreignField: '_id', as: 'donorDoc' } });
  pipeline.push({ $unwind: { path: '$donorDoc', preserveNullAndEmptyArrays: true } });

  // group by city (default) or donorType
  let groupKey = '$donorDoc.city';
  if (component.groupBy === 'donorType') groupKey = '$donorDoc.type';

  const groupStage = {
    _id: groupKey || null,
    donorCount: { $addToSet: '$donorDoc._id' },
    sumAmount: { $sum: '$amount' }
  };
  pipeline.push({ $group: groupStage });
  pipeline.push({ $project: { _id: 1, sumAmount: 1, donorCount: { $size: '$donorCount' } } });
  if (component.sort && Object.keys(component.sort).length) pipeline.push({ $sort: component.sort });

  let rows = await Donation.aggregate(pipeline);
  rows = rows.map(r => ({ key: r._id || 'Unknown', donorCount: r.donorCount || 0, sumAmount: r.sumAmount || 0 }));
  return { title: component.title, kind: component.kind || 'table', rows };
}

async function runCampaignComponent(component, filters, req) {
  const match = buildDonationMatch(filters, req);
  const pipeline = [ { $match: match } ];
  const groupStage = { _id: '$campaign', sumAmount: { $sum: '$amount' }, count: { $sum: 1 } };
  pipeline.push({ $group: groupStage });

  // lookup campaign names
  pipeline.push({ $lookup: { from: 'campaigns', localField: '_id', foreignField: '_id', as: 'camp' } });
  pipeline.push({ $unwind: { path: '$camp', preserveNullAndEmptyArrays: true } });
  pipeline.push({ $project: { _id: 1, sumAmount: 1, count: 1, campaignName: '$camp.name' } });
  if (component.sort && Object.keys(component.sort).length) pipeline.push({ $sort: component.sort });
  let rows = await Donation.aggregate(pipeline);
  rows = rows.map(r => ({ key: r.campaignName || String(r._id) || 'Unknown', sumAmount: r.sumAmount || 0, count: r.count || 0, campaignName: r.campaignName }));
  return { title: component.title, kind: component.kind || 'table', rows };
}

exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, organization } = req.query;
    const query = {};
    if (type && type !== 'all') query.type = type;
    if (organization && organization !== 'all') query.organization = organization;
    if (search) query.name = { $regex: search, $options: 'i' };

    const scoped = buildScopeQuery(req, query);

    const data = await Report.find(scoped)
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Report.countDocuments(scoped);
    res.status(200).json({ success: true, total, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('organization', 'name');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.status(200).json({ success: true, data: report });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const body = req.body;
    if (!body.name || !body.type || !body.organization) {
      return res.status(400).json({ success: false, message: 'Name, type, and organization are required' });
    }
    const payload = {
      name: body.name,
      type: body.type,
      organization: body.organization,
      filters: body.filters || {},
      fields: Array.isArray(body.fields) ? body.fields : [],
      components: Array.isArray(body.components) ? body.components : [],
      createdBy: req.user._id,
    };
    const doc = await Report.create(payload);
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const doc = await Report.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Report not found' });
    res.status(200).json({ success: true, message: 'Report deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const update = {};
    if (body.name != null) update.name = body.name;
    if (body.type != null) update.type = body.type;
    if (body.organization != null) update.organization = body.organization;
    if (body.filters != null) update.filters = body.filters;
    if (Array.isArray(body.fields)) update.fields = body.fields;
    if (Array.isArray(body.components)) update.components = body.components;
    const doc = await Report.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Report not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

function parseDate(d) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

function buildDonationMatch(filters, req) {
  const match = {};
  if (filters?.organization) match.organization = filters.organization;
  if (filters?.campaignId) match.campaign = filters.campaignId;
  if (filters?.paymentMethod) match.paymentMethod = filters.paymentMethod;
  if (filters?.type) match.type = filters.type;
  if (filters?.dateFrom || filters?.dateTo) {
    match.donationDate = {};
    if (filters.dateFrom) match.donationDate.$gte = parseDate(filters.dateFrom);
    if (filters.dateTo) {
      const to = parseDate(filters.dateTo);
      if (to) match.donationDate.$lte = to;
    }
  }
  match.status = 'completed';
  return buildScopeQuery(req, match);
}

async function runDonationComponent(component, filters, req) {
  const match = buildDonationMatch(filters, req);
  const pipeline = [{ $match: match }];

  const groupId = (() => {
    switch (component.groupBy) {
      case 'month':
        pipeline.push({ $addFields: { month: { $dateToString: { format: '%Y-%m', date: '$donationDate' } } } });
        return '$month';
      case 'campaign': return '$campaign';
      case 'organization': return '$organization';
      case 'paymentMethod': return '$paymentMethod';
      default: return null;
    }
  })();

  const groupStage = { _id: groupId || null };
  if (!component.metrics || component.metrics.includes('sumAmount')) groupStage.sumAmount = { $sum: '$amount' };
  if (!component.metrics || component.metrics.includes('count')) groupStage.count = { $sum: 1 };
  pipeline.push({ $group: groupStage });

  if (component.sort && Object.keys(component.sort).length) pipeline.push({ $sort: component.sort });

  let rows = await Donation.aggregate(pipeline);

  // Populate names for ids
  if (component.groupBy === 'campaign') {
    // Optionally lookup Campaign collection if exists
  } else if (component.groupBy === 'organization') {
    const orgMap = new Map();
    const orgIds = rows.map(r => r._id).filter(Boolean);
    if (orgIds.length) {
      const orgs = await Organization.find({ _id: { $in: orgIds } }, { _id: 1, name: 1 });
      orgs.forEach(o => orgMap.set(String(o._id), o.name));
    }
    rows = rows.map(r => ({ ...r, key: r._id ? (orgMap.get(String(r._id)) || String(r._id)) : 'All' }));
  } else if (component.groupBy === 'month') {
    rows = rows.map(r => ({ ...r, key: r._id || 'All' }));
  } else if (component.groupBy === 'paymentMethod') {
    rows = rows.map(r => ({ ...r, key: r._id || 'All' }));
  } else {
    rows = rows.map(r => ({ ...r, key: 'All' }));
  }

  return { title: component.title, kind: component.kind || 'table', rows };
}

// Build detail rows for user-selected fields
async function buildSelectedFieldsRows(filters, fields, req) {
  if (!Array.isArray(fields) || fields.length === 0) return { headers: [], rows: [] };
  const match = buildDonationMatch(filters, req);
  const pipeline = [ { $match: match } ];
  // Lookups for joined fields
  pipeline.push({ $lookup: { from: 'contacts', localField: 'donor', foreignField: '_id', as: 'donorDoc' } });
  pipeline.push({ $unwind: { path: '$donorDoc', preserveNullAndEmptyArrays: true } });
  pipeline.push({ $lookup: { from: 'organizations', localField: 'organization', foreignField: '_id', as: 'orgDoc' } });
  pipeline.push({ $unwind: { path: '$orgDoc', preserveNullAndEmptyArrays: true } });
  pipeline.push({ $lookup: { from: 'campaigns', localField: 'campaign', foreignField: '_id', as: 'campDoc' } });
  pipeline.push({ $unwind: { path: '$campDoc', preserveNullAndEmptyArrays: true } });

  // Limit to a reasonable number for export
  pipeline.push({ $limit: 2000 });

  const docs = await Donation.aggregate(pipeline);

  // Map friendly field names to getters
  const getters = {
    'Donor Name': (d) => [d.donorDoc?.firstName, d.donorDoc?.lastName].filter(Boolean).join(' ') || d.donorDoc?.name || '',
    'Donation Amount': (d) => d.amount || 0,
    'Donation Date': (d) => d.donationDate ? new Date(d.donationDate).toISOString().slice(0,10) : '',
    'Organization': (d) => d.orgDoc?.name || '',
    'Campaign': (d) => d.campDoc?.name || '',
    'Payment Method': (d) => d.paymentMethod || '',
    '80G Status': (d) => d.eightyGStatus || d.receiptStatus || '',
    'City': (d) => d.donorDoc?.city || '',
    'Donor Type': (d) => d.donorDoc?.type || ''
  };

  const headers = fields.filter(f => getters[f]);
  const rows = docs.map(d => {
    const o = {};
    headers.forEach(h => { o[h] = getters[h](d); });
    return o;
  });
  return { headers, rows };
}

exports.runReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const filters = report.filters || {};
    const components = report.components || [];

    const results = [];
    for (const c of components) {
      const key = (c.queryKey || '').toLowerCase();
      if (report.type === 'donation' || key.startsWith('donation')) {
        results.push(await runDonationComponent(c, filters, req));
      } else if (report.type === 'donor' || key.includes('donor')) {
        results.push(await runDonorComponent(c, filters, req));
      } else if (report.type === 'campaign' || key.includes('campaign')) {
        results.push(await runCampaignComponent(c, filters, req));
      } else if (report.type === 'financial' || key.includes('financial')) {
        // reuse donation grouping by paymentMethod if unspecified
        results.push(await runDonationComponent({ ...c, groupBy: c.groupBy || 'paymentMethod' }, filters, req));
      } else {
        results.push(await runDonationComponent(c, filters, req));
      }
    }

    // Optionally include selected fields detail preview (first 50) with full columns
    if (Array.isArray(report.fields) && report.fields.length) {
      const details = await buildSelectedFieldsRows(filters, report.fields, req);
      results.push({ title: 'Selected Fields (preview)', kind: 'table', headers: details.headers, rows: details.rows.slice(0, 50) });
    }

    res.status(200).json({ success: true, data: results });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

function toCSV(rows) {
  if (!rows || !rows.length) return 'key,sumAmount,count\n';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => (r[h] != null ? String(r[h]).replace(/,/g, ' ') : '')).join(','));
  return lines.join('\n');
}

exports.exportReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv' } = req.query;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    // Build rows from first component for export (donation component supported now)
    const filters = report.filters || {};
    const components = report.components || [];
    const firstComponent = components[0] || null;
    const first = firstComponent ? await runDonationComponent(firstComponent, filters, req) : { rows: [] };
    const rows = (first.rows || []).map(r => ({ key: r.key, sumAmount: r.sumAmount || 0, count: r.count || 0 }));

    // Build multi-component HTML for xls/doc
    const htmlTables = [];
    for (const c of components) {
      const key = (c.queryKey || '').toLowerCase();
      let result;
      if (key.startsWith('donation')) result = await runDonationComponent(c, filters, req);
      else if (key.includes('donor')) result = await runDonorComponent(c, filters, req);
      else if (key.includes('campaign')) result = await runCampaignComponent(c, filters, req);
      else result = await runDonationComponent(c, filters, req);
      const rws = (result.rows || []).map(r => ({ key: r.key, sumAmount: r.sumAmount || 0, count: r.count || 0 }));
      const table = `
        <h3 style="margin:8px 0;">${result.title || c.title || 'Section'}</h3>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;margin-bottom:12px;">
          <thead><tr><th>Key</th><th>Total Amount</th><th>Count</th></tr></thead>
          <tbody>
            ${rws.map(r => `<tr><td>${r.key}</td><td>${r.sumAmount}</td><td>${r.count}</td></tr>`).join('')}
          </tbody>
        </table>`;
      htmlTables.push(table);
    }

    if (format === 'xls') {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.name}</title></head><body>${htmlTables.join('\n')}</body></html>`;
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename=${report.name || 'report'}.xls`);
      return res.status(200).send(html);
    }

    if (format === 'doc' || format === 'word') {
      const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>${report.name}</title></head><body>
        <h2>${report.name}</h2>
        ${htmlTables.join('')}
      </body></html>`;
      res.setHeader('Content-Type', 'application/msword');
      res.setHeader('Content-Disposition', `attachment; filename=${report.name || 'report'}.doc`);
      return res.status(200).send(html);
    }

    if (format === 'pdf') {
      return res.status(400).json({ success: false, message: 'PDF export requires enabling a PDF renderer (e.g., Puppeteer). Please enable PDF support.' });
    }

    if (format === 'csv') {
      // Build a multi-section CSV by concatenating tables with blank lines
      const sections = [];
      if (components.length <= 1) {
        sections.push(toCSV(rows));
      } else {
        for (const c of components) {
          const key = (c.queryKey || '').toLowerCase();
          let result;
          if (key.startsWith('donation')) result = await runDonationComponent(c, filters, req);
          else if (key.includes('donor')) result = await runDonorComponent(c, filters, req);
          else if (key.includes('campaign')) result = await runCampaignComponent(c, filters, req);
          else result = await runDonationComponent(c, filters, req);
          const secRows = (result.rows || []).map(r => ({ key: r.key, sumAmount: r.sumAmount || 0, count: r.count || (r.donorCount || 0) }));
          sections.push(`# ${result.title || c.title || 'Section'}`);
          sections.push(toCSV(secRows));
          sections.push('');
        }
      }
      // Append Selected Fields CSV
      if (Array.isArray(report.fields) && report.fields.length) {
        const details = await buildSelectedFieldsRows(filters, report.fields, req);
        const headers = details.headers;
        const lines = [headers.join(',')];
        for (const r of details.rows) lines.push(headers.map(h => (r[h] != null ? String(r[h]).replace(/,/g,' ') : '')).join(','));
        sections.push('# Selected Fields');
        sections.push(lines.join('\n'));
      }
      const csv = sections.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${report.name || 'report'}.csv`);
      return res.status(200).send(csv);
    }

    // Unsupported format fallback
    return res.status(400).json({ success: false, message: 'Unsupported format. Use csv, xls, or doc.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
