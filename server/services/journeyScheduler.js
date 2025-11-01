const Journey = require('../models/Journey');
const JourneyRun = require('../models/JourneyRun');
const Contact = require('../models/Contact');
const { sendEmail, sendSMS, sendWhatsApp } = require('./senders');

let timer = null;

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

async function processRun(run) {
  const journey = await Journey.findById(run.journey);
  if (!journey || journey.status !== 'active') {
    // Stop runs if journey inactive
    run.status = 'stopped';
    await run.save();
    return;
  }

  const nodes = Array.isArray(journey.nodes) ? journey.nodes : [];
  const currentIdx = nodes.findIndex(n => n.id === run.currentNodeId);
  if (currentIdx === -1) {
    run.status = 'completed';
    await run.save();
    return;
  }
  const node = nodes[currentIdx];
  const contact = await Contact.findById(run.contact);

  let result = { ok: true };
  try {
    if (node.type === 'email') {
      const to = contact?.email;
      const subject = node.data?.subject || node.data?.title || 'Email';
      const body = node.data?.content || node.data?.subtitle || '';
      if (to) await sendEmail({ to, subject, html: body, text: body });
    } else if (node.type === 'sms') {
      const to = contact?.phone || contact?.mobile;
      const body = node.data?.content || node.data?.subtitle || '';
      if (to) await sendSMS({ to, body });
    } else if (node.type === 'whatsapp') {
      const to = contact?.whatsapp || contact?.phone || contact?.mobile;
      const body = node.data?.content || node.data?.subtitle || '';
      if (to) await sendWhatsApp({ to, body });
    } else if (node.type === 'condition') {
      // Basic conditions example
      const type = node.data?.conditionType;
      const value = node.data?.conditionValue;
      // For now, do a trivial condition check and proceed
      // You can extend with real donation checks, etc.
      result.condition = { type, value };
    }
  } catch (e) {
    result = { ok: false, error: e.message };
  }

  run.history = run.history || [];
  run.history.push({ nodeId: node.id, nodeType: node.type, executedAt: new Date(), result });
  run.lastExecutedAt = new Date();

  // Move to next node (sequential for now)
  const nextIdx = currentIdx + 1;
  if (nextIdx >= nodes.length) {
    run.status = 'completed';
    run.currentNodeId = undefined;
    run.scheduledAt = undefined;
    await run.save();
    return;
  }

  const nextNode = nodes[nextIdx];
  run.currentNodeId = nextNode.id;
  const delayMs = parseDelayToMs(nextNode?.data?.delay || '0m');
  run.scheduledAt = new Date(Date.now() + delayMs);
  run.status = 'running';
  await run.save();
}

async function tick() {
  const now = new Date();
  // Fetch due runs in small batches
  const runs = await JourneyRun.find({ status: { $in: ['pending', 'running'] }, scheduledAt: { $lte: now } }).limit(20);
  for (const run of runs) {
    await processRun(run);
  }
}

function startJourneyScheduler() {
  if (timer) return; // already started
  // tick every minute
  timer = setInterval(() => {
    tick().catch(err => console.log('Journey tick error:', err.message));
  }, 60 * 1000);
}

module.exports = { startJourneyScheduler };
