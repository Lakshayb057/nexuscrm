import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PageConfigModal from '../components/PageConfigModal';
import { Box, Button, Grid, Paper, Typography } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import styled from 'styled-components';

// Styled components for form elements
const StyledForm = styled.form`
  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    flex: 1;
    min-width: 250px;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}20`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 6px;
  font-size: 14px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}20`};
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}20`};
  }
`;

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &.btn-primary {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    
    &:hover {
      background: ${({ theme }) => theme.colors.primaryDark};
    }
    
    &:disabled {
      background: ${({ theme }) => theme.colors.muted};
      cursor: not-allowed;
    }
  }
  
  &.btn-danger {
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
    
    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  }
  
  &.btn-sm {
    padding: 6px 12px;
    font-size: 13px;
  }
`;

const SettingsTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const SettingsTab = styled.div`
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.text};
  background: ${({ theme, active }) => active ? `${theme.colors.primary}10` : theme.colors.bgLight};
  border: 1px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.border};
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme, active }) => active ? `${theme.colors.primary}15` : theme.colors.bg};
  }
`;

const StyledCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const CardBody = styled.div`
  padding: 20px;
`;

const ModalFooter = styled.div`
  padding: 16px 0 0;
  margin-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: flex-start;
  gap: 8px;
`;

export default function Settings() {
  const { register, handleSubmit, reset, watch } = useForm();
  const [activeTab, setActiveTab] = useState('general');
  const [selectedPage, setSelectedPage] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { setAppName, setTheme } = useAuth();

  // Available pages for configuration
  const availablePages = [
    { id: 'organizations', name: 'Organizations', icon: 'business' },
    { id: 'agencies', name: 'Agencies', icon: 'corporate_fare' },
    { id: 'channels', name: 'Channels', icon: 'hub' },
    { id: 'contacts', name: 'Contacts', icon: 'contacts' },
    { id: 'monthly-donations', name: 'Monthly Donations', icon: 'repeat' },
    { id: 'onetime-donations', name: 'One-time Donations', icon: 'redeem' },
    { id: 'payments', name: 'Payments', icon: 'payments' },
    { id: 'receipts', name: '80G Receipts', icon: 'receipt' },
    { id: 'campaigns', name: 'Campaigns', icon: 'campaign' },
    { id: 'journey-builder', name: 'Journey Builder', icon: 'route' },
    { id: 'reports', name: 'Reports', icon: 'assessment' },
    { id: 'users', name: 'User Management', icon: 'people' }
  ];

  const { data, isLoading, isError, refetch } = useQuery('settings', async () => {
    const res = await settingsAPI.getSettings();
    return res.data.settings;
  }, {
    onSuccess: (settings) => {
      reset(settings);
    }
  });

  const updateMutation = useMutation((formData) => settingsAPI.updateSettings(formData), {
    onSuccess: (res, variables) => {
      // variables is formData passed to mutate
      if (variables?.appName) setAppName(variables.appName);
      if (variables?.theme) {
        setTheme(variables.theme);
        try { localStorage.setItem('theme', variables.theme); } catch {}
      }
      toast.success('Settings updated');
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    }
  });

  const resetMutation = useMutation(() => settingsAPI.resetSettings(), {
    onSuccess: (res) => {
      const defaults = res.data.settings;
      reset(defaults);
      if (defaults?.appName) setAppName(defaults.appName);
      if (defaults?.theme) {
        setTheme(defaults.theme);
        try { localStorage.setItem('theme', defaults.theme); } catch {}
      }
      toast.success('Settings reset to defaults');
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reset settings');
    }
  });

  const onSubmit = (formData) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (isError) {
    return <div>Error loading settings.</div>;
  }

  return (
    <div style={{ color: 'var(--text-color)' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-color)' }}>System Settings</h2>
      </div>

      <SettingsTabs>
        <SettingsTab 
          active={activeTab === 'general'} 
          onClick={() => setActiveTab('general')}
        >
          General
        </SettingsTab>
        <SettingsTab 
          active={activeTab === 'api'} 
          onClick={() => setActiveTab('api')}
        >
          API Configuration
        </SettingsTab>
        <SettingsTab 
          active={activeTab === 'email'} 
          onClick={() => setActiveTab('email')}
        >
          Email Settings
        </SettingsTab>
        <SettingsTab 
          active={activeTab === 'sms'} 
          onClick={() => setActiveTab('sms')}
        >
          SMS Settings
        </SettingsTab>
        <SettingsTab 
          active={activeTab === 'receipt'} 
          onClick={() => setActiveTab('receipt')}
        >
          80G Receipt
        </SettingsTab>
        <SettingsTab 
          active={activeTab === 'currency'} 
          onClick={() => setActiveTab('currency')}
        >
          Currency
        </SettingsTab>
        <SettingsTab 
          active={activeTab === 'change-keys'} 
          onClick={() => setActiveTab('change-keys')}
        >
          Change Keys
        </SettingsTab>
        <SettingsTab 
          active={activeTab === 'page-config'} 
          onClick={() => setActiveTab('page-config')}
        >
          Page Configuration
        </SettingsTab>
      </SettingsTabs>

      <StyledCard>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <div style={{ display: 'flex', gap: '8px' }}>
            <StyledButton
              className="btn-danger btn-sm"
              onClick={() => {
                if (window.confirm('Reset settings to defaults? This will wipe your customizations.')) {
                  resetMutation.mutate();
                }
              }}
              disabled={resetMutation.isLoading}
            >
              {resetMutation.isLoading ? 'Resetting...' : 'Reset to Defaults'}
            </StyledButton>
            <StyledButton 
              type="button" 
              className="btn-primary btn-sm" 
              onClick={handleSubmit(onSubmit)} 
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
            </StyledButton>
          </div>
        </CardHeader>
        <CardBody>
          <StyledForm onSubmit={handleSubmit(onSubmit)}>
            {activeTab === 'general' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Application Name</label>
                    <StyledInput 
                      type="text" 
                      placeholder="NexusCRM" 
                      {...register('appName')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Theme</label>
                    <StyledSelect {...register('theme')}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </StyledSelect>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label>WhatsApp Business API URL</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter API URL" 
                      {...register('whatsappApi.apiUrl')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>API Key</label>
                    <StyledInput 
                      type="password" 
                      placeholder="Enter API key" 
                      {...register('whatsappApi.apiKey')} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number ID</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter phone number ID" 
                      {...register('whatsappApi.phoneNumberId')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Business ID</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter business ID" 
                      {...register('whatsappApi.businessId')} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label>SMTP Host</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter SMTP host" 
                      {...register('email.smtpHost')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port</label>
                    <StyledInput 
                      type="number" 
                      placeholder="Enter SMTP port" 
                      {...register('email.smtpPort', { valueAsNumber: true })} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter username" 
                      {...register('email.username')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <StyledInput 
                      type="password" 
                      placeholder="Enter password" 
                      {...register('email.password')} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>From Email</label>
                    <StyledInput 
                      type="email" 
                      placeholder="Enter from email address" 
                      {...register('email.fromEmail')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>From Name</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter from name" 
                      {...register('email.fromName')} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sms' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label>SMS Provider</label>
                    <StyledSelect {...register('sms.provider')}>
                      <option value="">Select Provider</option>
                      <option value="twilio">Twilio</option>
                      <option value="plivo">Plivo</option>
                      <option value="nexmo">Nexmo</option>
                      <option value="other">Other</option>
                    </StyledSelect>
                  </div>
                  <div className="form-group">
                    <label>Account SID</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter account SID" 
                      {...register('sms.accountSid')} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Auth Token</label>
                    <StyledInput 
                      type="password" 
                      placeholder="Enter auth token" 
                      {...register('sms.authToken')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>From Number</label>
                    <StyledInput 
                      type="text" 
                      placeholder="Enter from number" 
                      {...register('sms.fromNumber')} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'receipt' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Receipt Prefix</label>
                    <StyledInput 
                      type="text" 
                      placeholder="80G-" 
                      {...register('receipt.prefix')} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Receipt Header</label>
                    <StyledTextarea 
                      placeholder="Enter receipt header content" 
                      rows={3} 
                      {...register('receipt.header')} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Receipt Footer</label>
                    <StyledTextarea 
                      placeholder="Enter receipt footer content" 
                      rows={3} 
                      {...register('receipt.footer')} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Signature Image URL</label>
                    <StyledInput 
                      type="text" 
                      placeholder="https://..." 
                      {...register('receipt.signatureImageUrl')} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Organization Stamp URL</label>
                    <StyledInput 
                      type="text" 
                      placeholder="https://..." 
                      {...register('receipt.orgStampUrl')} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Terms & Conditions</label>
                    <StyledTextarea 
                      placeholder="Enter terms and conditions" 
                      rows={5} 
                      {...register('receipt.terms')} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'currency' && (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Default Currency</label>
                    <StyledSelect {...register('currency.defaultCurrency')}>
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">Pound (£)</option>
                    </StyledSelect>
                  </div>
                  <div className="form-group">
                    <label>Currency Symbol Position</label>
                    <StyledSelect {...register('currency.symbolPosition')}>
                      <option value="before">Before amount (₹100)</option>
                      <option value="after">After amount (100₹)</option>
                    </StyledSelect>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Thousands Separator</label>
                    <StyledSelect {...register('currency.thousandsSeparator')}>
                      <option value="comma">Comma (1,00,000)</option>
                      <option value="space">Space (1 00 000)</option>
                      <option value="period">Period (1.00.000)</option>
                    </StyledSelect>
                  </div>
                  <div className="form-group">
                    <label>Decimal Separator</label>
                    <StyledSelect {...register('currency.decimalSeparator')}>
                      <option value="period">Period (100.00)</option>
                      <option value="comma">Comma (100,00)</option>
                    </StyledSelect>
                  </div>
                </div>
              </div>
            )}

            <ModalFooter>
              <StyledButton 
                type="submit" 
                className="btn-primary" 
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
              </StyledButton>
            </ModalFooter>
          </StyledForm>
        </CardBody>
      </StyledCard>
    </div>
  );
}
