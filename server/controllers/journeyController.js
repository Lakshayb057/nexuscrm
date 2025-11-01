const Journey = require('../models/Journey');
const JourneyRun = require('../models/JourneyRun');
const Contact = require('../models/Contact');

exports.getJourneys = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, organization, status } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (organization) query.organization = organization;
    if (status && status !== 'all') query.status = status;

    if (req.user.role !== 'admin' && req.user.organization && !query.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }

    const docs = await Journey.find(query)
      .populate('organization', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Journey.countDocuments(query);

    res.status(200).json({ success: true, total, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Journey.findById(id).populate('organization', 'name');
    if (!doc) return res.status(404).json({ success: false, message: 'Journey not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createJourney = async (req, res) => {
  try {
    const body = req.body;
    const payload = {
      name: body.name,
      organization: body.organization,
      status: body.status || 'draft',
      description: body.description || '',
      nodes: Array.isArray(body.nodes) ? body.nodes : [],
      edges: Array.isArray(body.edges) ? body.edges : [],
      createdBy: req.user._id,
    };
    if (!payload.name || !payload.organization) {
      return res.status(400).json({ success: false, message: 'Name and Organization are required' });
    }
    const doc = await Journey.create(payload);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const update = {
      name: body.name,
      organization: body.organization,
      status: body.status,
      description: body.description,
      nodes: Array.isArray(body.nodes) ? body.nodes : undefined,
      edges: Array.isArray(body.edges) ? body.edges : undefined,
    };

    const doc = await Journey.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Journey not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Journey.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Journey not found' });
    res.status(200).json({ success: true, message: 'Journey deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.activateJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Journey.findByIdAndUpdate(id, { status: 'active' }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Journey not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deactivateJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Journey.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Journey not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.enrollContacts = async (req, res) => {
  try {
    const { id } = req.params; // journey id
    const { contacts } = req.body; // array of contact IDs
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide contacts array' });
    }

    const journey = await Journey.findById(id);
    if (!journey) return res.status(404).json({ success: false, message: 'Journey not found' });
    if (journey.status !== 'active') return res.status(400).json({ success: false, message: 'Journey must be active to enroll' });

    // Scope to organization for non-admins
    if (req.user.role !== 'admin' && req.user.organization) {
      const userOrgId = req.user.organization._id || req.user.organization;
      if (String(journey.organization) !== String(userOrgId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to enroll into this journey' });
      }
    }

    // Validate contacts exist and (optional) belong to same org if your Contact has organization field
    const uniqueIds = [...new Set(contacts.filter(Boolean))];
    const foundContacts = await Contact.find({ _id: { $in: uniqueIds } }, { _id: 1 });
    const foundIds = new Set(foundContacts.map(c => String(c._id)));
    const invalid = uniqueIds.filter(id => !foundIds.has(String(id)));
    if (invalid.length) {
      return res.status(400).json({ success: false, message: `Invalid contact IDs: ${invalid.join(',')}` });
    }

    // Determine first node (no edges logic yet: pick first in array). If none, create pending runs without schedule.
    const firstNode = Array.isArray(journey.nodes) && journey.nodes.length ? journey.nodes[0] : null;

    let docs = [];
    if (firstNode) {
      const delayMs = parseDelayToMs(firstNode?.data?.delay || '0m');
      const scheduledAt = new Date(Date.now() + delayMs);
      docs = await Promise.all(uniqueIds.map(contactId => {
        return JourneyRun.create({
          journey: journey._id,
          contact: contactId,
          organization: journey.organization,
          status: 'pending',
          currentNodeId: firstNode.id,
          scheduledAt,
        });
      }));
    } else {
      docs = await Promise.all(uniqueIds.map(contactId => {
        return JourneyRun.create({
          journey: journey._id,
          contact: contactId,
          organization: journey.organization,
          status: 'pending',
        });
      }));
    }

    res.status(201).json({ success: true, data: { count: docs.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJourneyRuns = async (req, res) => {
  try {
    const { id } = req.params;
    const runs = await JourneyRun.find({ journey: id })
      .populate('contact', 'firstName lastName name email phone mobile whatsapp')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, total: runs.length, data: runs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function parseDelayToMs(delay) {
  if (!delay || typeof delay !== 'string') return 0;
  const m = delay.trim().match(/^(\d+)\s*([mhd])$/i);
  if (!m) return 0;
  const val = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit === 'm') return val * 60 * 1000;
  if (unit === 'h') return val * 60 * 60 * 1000;
  if (unit === 'd') return val * 24 * 60 * 60 * 1000;
  return 0;
}
