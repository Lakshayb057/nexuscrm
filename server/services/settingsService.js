const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Setting = require('../models/Setting');

let cached = { settings: null, at: 0 };
const TTL_MS = 60 * 1000; // 60 seconds cache

async function loadSettings(force = false) {
  const now = Date.now();
  if (!force && cached.settings && now - cached.at < TTL_MS) {
    return cached.settings;
  }
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  cached = { settings, at: now };
  return settings;
}

function buildEmailTransport(emailCfg) {
  if (!emailCfg) return null;
  // Prefer explicit SMTP settings; fall back to service if host not given
  if (emailCfg.smtpHost) {
    const secure = Number(emailCfg.smtpPort) === 465;
    return nodemailer.createTransport({
      host: emailCfg.smtpHost,
      port: Number(emailCfg.smtpPort || 587),
      secure,
      auth: emailCfg.username && emailCfg.password ? {
        user: emailCfg.username,
        pass: emailCfg.password,
      } : undefined,
    });
  }
  return null;
}

function buildSmsClient(smsCfg) {
  if (!smsCfg) return null;
  if ((smsCfg.provider || '').toLowerCase() === 'twilio' && smsCfg.accountSid && smsCfg.authToken) {
    return twilio(smsCfg.accountSid, smsCfg.authToken);
  }
  return null;
}

module.exports = {
  loadSettings,
  async getSettings(force = false) {
    return loadSettings(force);
  },
  invalidateCache() {
    cached = { settings: null, at: 0 };
  },
  async getEmailTransport() {
    const s = await loadSettings();
    return buildEmailTransport(s.email);
  },
  async getEmailFrom() {
    const s = await loadSettings();
    const fromName = (s.email && s.email.fromName) || s.appName || 'NexusCRM';
    const fromEmail = (s.email && s.email.fromEmail) || 'no-reply@nexuscrm.in';
    return `${fromName} <${fromEmail}>`;
  },
  async getSmsClient() {
    const s = await loadSettings();
    return buildSmsClient(s.sms);
  },
  async getSmsFromNumber() {
    const s = await loadSettings();
    return (s.sms && s.sms.fromNumber) || undefined;
  },
  async getWhatsAppConfig() {
    const s = await loadSettings();
    return s.whatsappApi || {};
  }
};
