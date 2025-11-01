const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'number', 'date', 'select', 'checkbox', 'textarea', 'email', 'phone'],
    default: 'text' 
  },
  required: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  options: [{ 
    label: String, 
    value: mongoose.Schema.Types.Mixed 
  }],
  placeholder: String,
  order: { type: Number, default: 0 },
  width: { type: String, default: '100%' },
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    errorMessage: String
  }
}, { _id: false });

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  icon: { type: String, default: 'file' },
  fields: [fieldSchema],
  actions: {
    export: { type: Boolean, default: true },
    import: { type: Boolean, default: true },
    create: { type: Boolean, default: true },
    edit: { type: Boolean, default: true },
    delete: { type: Boolean, default: true },
    view: { type: Boolean, default: true },
    bulkActions: { type: Boolean, default: true }
  },
  listView: {
    columns: [{
      field: { type: String, required: true },
      label: { type: String, required: true },
      visible: { type: Boolean, default: true },
      sortable: { type: Boolean, default: true },
      filterable: { type: Boolean, default: true },
      width: String
    }],
    defaultSort: {
      field: { type: String, default: 'createdAt' },
      order: { type: String, enum: ['asc', 'desc'], default: 'desc' }
    },
    itemsPerPage: { type: Number, default: 10 }
  },
  formLayout: {
    layout: { 
      type: String, 
      enum: ['vertical', 'horizontal', 'inline'], 
      default: 'vertical' 
    },
    gridColumns: { type: Number, default: 2 },
    sections: [{
      title: String,
      fields: [String],
      collapsible: { type: Boolean, default: false },
      defaultCollapsed: { type: Boolean, default: false }
    }]
  },
  customCSS: String,
  customJS: String
}, { timestamps: true });

const SettingSchema = new mongoose.Schema(
  {
    appName: { type: String, default: 'NexusCRM' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },

    // Page configurations
    pages: [pageSchema],

    // Existing settings
    currency: {
      defaultCurrency: { type: String, default: 'INR' },
      symbolPosition: { type: String, enum: ['before', 'after'], default: 'before' },
      thousandsSeparator: { type: String, enum: ['comma', 'space', 'period'], default: 'comma' },
      decimalSeparator: { type: String, enum: ['period', 'comma'], default: 'period' },
    },

    whatsappApi: {
      apiUrl: { type: String, default: '' },
      apiKey: { type: String, default: '' },
      phoneNumberId: { type: String, default: '' },
      businessId: { type: String, default: '' },
    },

    email: {
      smtpHost: { type: String, default: '' },
      smtpPort: { type: Number, default: 587 },
      username: { type: String, default: '' },
      password: { type: String, default: '' },
      fromEmail: { type: String, default: 'no-reply@nexuscrm.in' },
      fromName: { type: String, default: 'NexusCRM' },
    },

    sms: {
      provider: { type: String, default: 'Twilio' },
      accountSid: { type: String, default: '' },
      authToken: { type: String, default: '' },
      fromNumber: { type: String, default: '' },
    },

    receipt: {
      prefix: { type: String, default: '80G-' },
      header: { type: String, default: '' },
      footer: { type: String, default: '' },
      signatureImageUrl: { type: String, default: '' },
      orgStampUrl: { type: String, default: '' },
      terms: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Add static methods
SettingSchema.statics.getPageConfig = async function(pageName) {
  const settings = await this.findOne({});
  if (!settings) return null;
  return settings.pages.find(page => page.name === pageName);
};

SettingSchema.statics.updatePageConfig = async function(pageName, updates) {
  const settings = await this.findOne({});
  if (!settings) return null;
  
  const pageIndex = settings.pages.findIndex(p => p.name === pageName);
  if (pageIndex === -1) {
    settings.pages.push({ ...updates, name: pageName });
  } else {
    settings.pages[pageIndex] = { ...settings.pages[pageIndex].toObject(), ...updates };
  }
  
  return settings.save();
};

module.exports = mongoose.model('Setting', SettingSchema);
