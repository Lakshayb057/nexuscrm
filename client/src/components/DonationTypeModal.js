import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { donationsAPI } from '../services/api';
import { generateDonorId, getNextSequenceNumber } from '../utils/donorIdGenerator';

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.text};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const DonationButton = styled.button`
  flex: 1;
  padding: 12px;
  border: 2px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.border};
  border-radius: 8px;
  background: ${({ theme, active }) => active ? 'rgba(59, 130, 246, 0.1)' : 'transparent'};
  color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.text};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  i {
    font-size: 24px;
  }
`;

const CancelButton = styled.button`
  margin-top: 20px;
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const DonationTypeModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [nextDonorId, setNextDonorId] = useState('');

  useEffect(() => {
    const fetchNextDonorId = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const nextSequence = await getNextSequenceNumber('one-time');
          const newDonorId = generateDonorId('one-time', nextSequence);
          setNextDonorId(newDonorId);
        } catch (error) {
          console.error('Error fetching next donor ID:', error);
          // Fallback to a default ID if there's an error
          setNextDonorId(generateDonorId('one-time', 1));
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchNextDonorId();
  }, [isOpen]);

  const handleDonationTypeSelect = async (type) => {
    try {
      setIsLoading(true);
      // Get the next sequence number for the selected type
      const nextSequence = await getNextSequenceNumber(type);
      // Generate the donor ID
      const donorId = generateDonorId(type, nextSequence);
      
      // Navigate to the new donation page with the generated donor ID
      navigate(`/donations/new?type=${type}&donorId=${donorId}`);
      onClose();
    } catch (error) {
      console.error('Error generating donor ID:', error);
      // Fallback to navigation without donor ID if there's an error
      navigate(`/donations/new?type=${type}`);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>Select Donation Type</ModalHeader>
        {isLoading ? (
          <p>Loading donor ID...</p>
        ) : (
          <>
            {nextDonorId && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '10px', 
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <p style={{ margin: '0', fontSize: '14px', color: '#1e40af' }}>
                  Next Donor ID: <strong>{nextDonorId}</strong>
                </p>
              </div>
            )}
            <ButtonGroup>
              <DonationButton 
                onClick={() => handleDonationTypeSelect('one-time')}
                disabled={isLoading}
              >
                <span>💸</span>
                One-Time Donation
                <small style={{ fontSize: '12px', opacity: 0.8 }}>Starts with SSOTD</small>
              </DonationButton>
              <DonationButton 
                onClick={() => handleDonationTypeSelect('monthly')}
                disabled={isLoading}
              >
                <span>🔄</span>
                Monthly Donation
                <small style={{ fontSize: '12px', opacity: 0.8 }}>Starts with SSMD</small>
              </DonationButton>
            </ButtonGroup>
            
            <CancelButton onClick={onClose} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Cancel'}
            </CancelButton>
          </>
        )}
      </ModalContent>
    </ModalBackdrop>
  );
};

export default DonationTypeModal;
