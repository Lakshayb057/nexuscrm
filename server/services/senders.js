const { getEmailTransport, getEmailFrom, getSmsClient, getSmsFromNumber, getWhatsAppConfig } = require('./settingsService');

function isDev() { return process.env.NODE_ENV !== 'production'; }

exports.sendEmail = async ({ to, subject, html, text, from }) => {
  const mailer = await getEmailTransport();
  const defaultFrom = await getEmailFrom();
  const fromAddr = from || defaultFrom;
  if (!mailer) {
    console.log('[Email Dev Fallback] To:', to, 'Subject:', subject);
    return { success: true, dev: true };
  }
  await mailer.sendMail({ from: fromAddr, to, subject, html, text });
  return { success: true };
};

exports.sendSMS = async ({ to, body }) => {
  const client = await getSmsClient();
  const from = await getSmsFromNumber();
  if (!client || !from) {
    console.log('[SMS Dev Fallback] To:', to, 'Body:', body);
    return { success: true, dev: true };
  }
  await client.messages.create({ body, from, to });
  return { success: true };
};

exports.sendWhatsApp = async ({ to, body }) => {
  const cfg = await getWhatsAppConfig();
  if (!cfg || !cfg.apiKey || !cfg.phoneNumberId) {
    console.log('[WhatsApp Dev Fallback] To:', to, 'Body:', body);
    return { success: true, dev: true };
  }
  const url = (cfg.apiUrl && cfg.apiUrl.trim()) || `https://graph.facebook.com/v17.0/${cfg.phoneNumberId}/messages`;
  const payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body } };
  // Use global fetch if available, otherwise log
  if (typeof fetch !== 'function') {
    console.log('[WhatsApp] fetch not available in runtime. To send real WhatsApp messages, ensure Node 18+ or add a fetch polyfill.');
    return { success: true, dev: true };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp send failed: ${res.status} ${text}`);
  }
  return { success: true };
};
