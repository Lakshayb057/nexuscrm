import React, { useState, useEffect } from 'react';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { donationsAPI, contactsAPI } from '../services/api';
import DonationTypeModal from '../components/DonationTypeModal';
import BulkUploadModal from '../components/BulkUploadModal';
import DonationTrendChart from '../components/DonationTrendChart';
import {
  DashboardContainer,
  StatsGrid,
  StatCard,
  StatHeader,
  StatIcon,
  StatValue,
  StatLabel,
  StatChange,
  TabsContainer,
  TabButton,
  DonationsTable,
  TableHeader,
  TableRow,
  TableCell,
  StatusBadge,
  ActionButton,
  SectionTitle,
  SectionContainer
} from './Dashboard.styles';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeDonors: 0,
    monthlyDonations: 0,
    oneTimeDonations: 0,
    pendingReceipts: 0
  });
  const [allDonations, setAllDonations] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  
  // Function to generate a donor ID for existing donations if not present
  const generateDonorIdForDonation = (donation, index) => {
    if (donation.donorId) return donation.donorId;
    
    // Generate ID based on donation type and index to ensure uniqueness
    const prefix = donation.type === 'monthly' ? 'SSMD' : 'SSOTD';
    // Start from 1,000,000 and add index to create unique IDs
    const sequence = 1000000 + (index + 1);
    return `${prefix}${sequence.toString().padStart(7, '0')}`;
  };
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all necessary data in parallel
      const [donationsRes, contactsRes, receiptsRes] = await Promise.all([
        donationsAPI.getDonations({}),
        contactsAPI.getContacts({ limit: 100 }),
        donationsAPI.getDonations({ 
          receiptStatus: 'pending',
          receiptType: '80G',
          limit: 1000 // Adjust based on your needs
        })
      ]);

      const donations = donationsRes.data.data || [];
      const contacts = contactsRes.data.data || [];
      const pendingReceipts = receiptsRes.data.data || [];

      console.log('Fetched donations:', donations.map(d => ({
        id: d._id,
        date: d.donationDate,
        type: d.type,
        amount: d.amount,
        donor: d.donor?.name
      })));

      // Calculate total donations
      const totalDonations = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
      
      // Count active monthly donors (donors with active monthly subscriptions)
      const activeDonors = new Set(
        donations
          .filter(donation => 
            donation.type === 'monthly' && 
            donation.subscriptionStatus === 'active' &&
            donation.donor?._id // Ensure we have a valid donor
          )
          .map(donation => donation.donor._id)
      ).size;
      
      // Count monthly and one-time donations
      const monthlyDonations = donations.filter(donation => donation.type === 'monthly').length;
      const oneTimeDonations = donations.filter(donation => donation.type === 'one-time').length;

      // Sort donations by date in descending order (newest first)
      const sortedDonations = [...donations].sort((a, b) => 
        new Date(b.donationDate) - new Date(a.donationDate)
      );

      setAllDonations(sortedDonations);
      setFilteredDonations(sortedDonations);
      
      // Count unique donors with pending 80G receipts
      const pendingReceiptsCount = new Set(
        pendingReceipts
          .filter(receipt => receipt.eligibleFor80G && !receipt.receiptIssued)
          .map(receipt => receipt._id)
      ).size;

      setStats({
        totalDonations,
        activeDonors,
        oneTimeDonations,
        monthlyDonations,
        pendingReceipts: pendingReceiptsCount
      });

      setRecentDonations(sortedDonations);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDonationsByDateRange = (donations, range) => {
    // If no range is selected, return all donations
    if (!range || range === 'all') {
      console.log('No date range selected, showing all donations');
      return [...donations];
    }
    
    const now = new Date();
    let startDate;
    
    switch(range) {
      case 'weekly':
        startDate = subDays(now, 7);
        break;
      case 'monthly':
        startDate = subMonths(now, 1);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case 'yearly':
        startDate = subYears(now, 1);
        break;
      default:
        console.log('Unknown date range, showing all donations');
        return [...donations];
    }
    
    console.log(`Filtering donations between ${startDate} and ${now}`);
    
    const filtered = donations.filter(donation => {
      if (!donation.donationDate) {
        console.log('Donation missing date:', donation._id);
        return false;
      }
      const donationDate = new Date(donation.donationDate);
      const isInRange = donationDate >= startDate && donationDate <= now;
      
      if (!isInRange) {
        console.log('Donation outside range:', {
          id: donation._id,
          date: donation.donationDate,
          amount: donation.amount,
          type: donation.type,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        });
      }
      
      return isInRange;
    });
    
    console.log(`Found ${filtered.length} donations in date range`);
    return filtered;
  };

  // Update filtered donations when filters change
  useEffect(() => {
    if (!allDonations.length) return;
    
    console.log('Filtering donations with timeRange:', timeRange);
    
    // First filter by date range
    let filtered = filterDonationsByDateRange(allDonations, timeRange);
    
    console.log(`Found ${filtered.length} donations after date filtering`);
    
    // Then filter by type if needed
    if (activeTab !== 'all') {
      filtered = filtered.filter(donation => donation.type === activeTab);
      console.log(`Found ${filtered.length} donations after type filtering`);
    }
    
    setFilteredDonations(filtered);
    
    // Update stats based on filtered data
    const totalDonations = filtered.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const monthlyDonations = filtered.filter(d => d.type === 'monthly').length;
    const oneTimeDonations = filtered.length - monthlyDonations;
    
    setStats(prev => ({
      ...prev,
      totalDonations,
      monthlyDonations,
      oneTimeDonations
    }));
    
    setRecentDonations(filtered);
  }, [activeTab, allDonations, timeRange]);
  
  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardContainer>
      <h1>Welcome back, {user?.name || 'User'}</h1>
      
      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatIcon>💰</StatIcon>
            <StatValue>₹{stats.totalDonations.toLocaleString()}</StatValue>
          </StatHeader>
          <StatLabel>Total Donations</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatIcon>👥</StatIcon>
            <StatValue>{stats.activeDonors}</StatValue>
          </StatHeader>
          <StatLabel>Active Monthly Donors</StatLabel>
          {stats.activeDonors > 0 && (
            <StatChange className="text-success">
              <i className="fas fa-arrow-up"></i> {stats.activeDonors} active
            </StatChange>
          )}
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatIcon>🔄</StatIcon>
            <StatValue>{stats.monthlyDonations}</StatValue>
          </StatHeader>
          <StatLabel>Monthly Donations</StatLabel>
        </StatCard>

        <StatCard>
          <StatHeader>
            <div>
              <StatLabel>Pending 80G Receipts</StatLabel>
              <StatValue>{stats.pendingReceipts}</StatValue>
            </div>
            <StatIcon>
              <i className="fas fa-receipt"></i>
            </StatIcon>
          </StatHeader>
          {stats.pendingReceipts > 0 ? (
            <StatChange className="text-warning">
              <i className="fas fa-exclamation-circle"></i> {stats.pendingReceipts} to process
            </StatChange>
          ) : (
            <StatChange className="text-success">
              <i className="fas fa-check-circle"></i> All caught up!
            </StatChange>
          )}
        </StatCard>
      </StatsGrid>

      <DonationTrendChart 
        donations={filteredDonations} 
        timeRange={timeRange} 
      />
      
      <div className="card">
        <div className="card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="card-title" style={{ margin: 0 }}>Recent Donations</div>
            <div className="form-group" style={{ margin: 0 }}>
              <select 
                className="form-control form-control-sm" 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="all">All Time</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="yearly">Last Year</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowDonationModal(true)}
            >
              <i className="fas fa-plus"></i> New Donation
            </button>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowBulkUploadModal(true)}
              title="Bulk upload donations"
            >
              <i className="fas fa-upload"></i> Bulk Upload
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
          <table className="data-table" style={{width:'100%'}}>
            <thead>
              <tr>
                <th>Donor ID</th>
                <th>Donor</th>
                <th>Date</th>
                <th>Organization</th>
                <th>Agency</th>
                <th>Type</th>
                <th>Amount</th>
                <th>80G Receipt</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((donation, index) => (
                <tr key={donation._id}>
                  <td>
                    <code>{donation.donorId || generateDonorIdForDonation(donation, index)}</code>
                  </td>
                  <td>{donation.donor?.firstName} {donation.donor?.lastName}</td>
                  <td>{donation.donationDate ? new Date(donation.donationDate).toLocaleDateString() : '-'}</td>
                  <td>{donation.organization?.name}</td>
                  <td>{donation.agency?.name || 'Direct'}</td>
                  <td>{donation.type}</td>
                  <td>₹{(donation.amount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`receipt-status status-${donation.receiptStatus}`}>
                      {donation.receiptStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${donation.status === 'completed' ? 'success' : 'warning'}`}>
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      <DonationTypeModal 
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
      />
    </DashboardContainer>
  );
};

export default Dashboard;
