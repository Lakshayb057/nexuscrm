import React, { createContext, useContext, useEffect, useState } from 'react';
import settingsService from '../services/settingsService';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { settings } = await settingsService.getSettings();
      setSettings(settings);
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load application settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates) => {
    try {
      const { settings: updatedSettings } = await settingsService.updateSettings(updates);
      setSettings(updatedSettings);
      return { success: true };
    } catch (err) {
      console.error('Failed to update settings:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to update settings' 
      };
    }
  };

  const resetSettings = async () => {
    try {
      const { settings: defaultSettings } = await settingsService.resetSettings();
      setSettings(defaultSettings);
      return { success: true };
    } catch (err) {
      console.error('Failed to reset settings:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to reset settings' 
      };
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        resetSettings,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
