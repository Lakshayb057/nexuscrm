const Setting = require('../models/Setting');
const { invalidateCache } = require('../services/settingsService');

// Default settings structure
const DEFAULT_SETTINGS = {
  theme: {
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    mode: 'light'
  },
  organization: {
    name: 'NexusCRM',
    logo: '/logo.png',
    address: '',
    contact: {}
  },
  features: {
    darkMode: true,
    notifications: true,
    analytics: false
  },
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
  version: '1.0.0'
};

// Initialize default settings if not exists
const initializeDefaultSettings = async () => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      console.log('Initializing default settings...');
      await Setting.create(DEFAULT_SETTINGS);
      console.log('Default settings initialized');
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};

// Call this function when server starts
initializeDefaultSettings();

exports.getSettings = async (req, res) => {
  try {
    console.log('[Settings] Fetching settings...');
    let settings = await Setting.findOne();
    
    if (!settings) {
      console.log('[Settings] No settings found, creating default settings...');
      settings = await Setting.create(DEFAULT_SETTINGS);
      console.log('[Settings] Created default settings');
    }
    
    res.status(200).json({ 
      success: true, 
      settings: settings.toObject()
    });
  } catch (error) {
    console.error('[Settings] Error in getSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    console.log('[Settings] Updating settings...');
    const update = req.body || {};
    
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No update data provided' 
      });
    }
    
    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: update },
      { 
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );
    
    console.log('[Settings] Settings updated successfully');
    invalidateCache();
    
    res.status(200).json({ 
      success: true, 
      settings: settings.toObject() 
    });
  } catch (error) {
    console.error('[Settings] Error in updateSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.resetSettings = async (req, res) => {
  try {
    console.log('[Settings] Resetting to default settings...');
    
    await Setting.deleteMany({});
    const settings = await Setting.create(DEFAULT_SETTINGS);
    
    console.log('[Settings] Settings reset to default');
    invalidateCache();
    
    res.status(200).json({ 
      success: true, 
      settings: settings.toObject(),
      message: 'Settings reset to default successfully'
    });
  } catch (error) {
    console.error('[Settings] Error in resetSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
