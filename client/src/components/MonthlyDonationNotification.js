import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { donationsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';

const MonthlyDonationNotification = () => {
  const [open, setOpen] = useState(false);
  const [donations, setDonations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch expiring/expired monthly donations
  const { data, refetch } = useQuery(
    'monthlyDonationStatus',
    () => donationsAPI.getMonthlyDonationStatus(),
    {
      refetchInterval: 300000, // Check every 5 minutes
      onSuccess: (data) => {
        if (data?.data?.length > 0) {
          setDonations(data.data);
          setOpen(true);
        }
      }
    }
  );

  const updateSubscription = useMutation(
    ({ id, status }) => donationsAPI.updateSubscriptionStatus(id, { status }),
    {
      onSuccess: () => {
        refetch();
        toast.success('Subscription updated successfully');
        if (currentIndex >= donations.length - 1) {
          setOpen(false);
          setCurrentIndex(0);
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update subscription');
      }
    }
  );

  const currentDonation = donations[currentIndex];

  if (!currentDonation) return null;

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Monthly Donation Due</DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="body1" gutterBottom>
            <strong>Donor:</strong> {currentDonation.donor?.name || 'N/A'}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Amount:</strong> {currentDonation.currency} {currentDonation.amount.toFixed(2)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Next Donation Date:</strong> {format(new Date(currentDonation.nextDonationDate), 'PPP')}
          </Typography>
          <Typography variant="body1" color="error" gutterBottom>
            This monthly donation is due soon. What would you like to do?
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => {
            updateSubscription.mutate({ 
              id: currentDonation._id, 
              status: 'cancelled' 
            });
          }}
          color="error"
          disabled={updateSubscription.isLoading}
        >
          {updateSubscription.isLoading ? <CircularProgress size={24} /> : 'Cancel Subscription'}
        </Button>
        <Button 
          onClick={() => {
            updateSubscription.mutate({ 
              id: currentDonation._id, 
              status: 'paused' 
            });
          }}
          color="warning"
          disabled={updateSubscription.isLoading}
        >
          {updateSubscription.isLoading ? <CircularProgress size={24} /> : 'Pause for Now'}
        </Button>
        <Button 
          onClick={() => {
            updateSubscription.mutate({ 
              id: currentDonation._id, 
              status: 'active' 
            });
          }}
          color="primary"
          variant="contained"
          disabled={updateSubscription.isLoading}
        >
          {updateSubscription.isLoading ? <CircularProgress size={24} /> : 'Continue Donation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MonthlyDonationNotification;
