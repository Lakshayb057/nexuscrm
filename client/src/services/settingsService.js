import api from './api';

const settingsService = {
  /**
   * Get current settings
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  /**
   * Update settings
   * @param {Object} updates - Settings updates
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(updates) {
    try {
      const response = await api.put('/settings', updates);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Reset settings to defaults
   * @returns {Promise<Object>} Default settings
   */
  async resetSettings() {
    try {
      const response = await api.post('/settings/reset');
      return response.data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },

  /**
   * Get a specific setting by path
   * @param {string} path - Dot notation path to the setting (e.g., 'theme.primaryColor')
   * @returns {Promise<*>} The setting value
   */
  async getSetting(path) {
    try {
      const response = await this.getSettings();
      return path.split('.').reduce((obj, key) => obj?.[key], response.settings);
    } catch (error) {
      console.error(`Error getting setting ${path}:`, error);
      throw error;
    }
  }
};

export default settingsService;
