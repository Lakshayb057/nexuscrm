import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueryClientProvider as Provider } from './providers/QueryClientProvider';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout/Layout';
import Contacts from './pages/Contacts';
import Organizations from './pages/Organizations';
import Agencies from './pages/Agencies';
import Channels from './pages/Channels';
import MonthlyDonations from './pages/MonthlyDonations';
import Donations from './pages/Donations';
import Payments from './pages/Payments';
import Receipts from './pages/Receipts';
import Campaigns from './pages/Campaigns';
import Journeys from './pages/Journeys';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import MonthlyDonationNotification from './components/MonthlyDonationNotification';
import { GlobalStyles } from './styles/GlobalStyles';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './styles/theme';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? children : <Navigate to="/" />;
};

const AppContent = () => {
  const { user, theme, loading } = useAuth();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyles />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="agencies" element={<Agencies />} />
            <Route path="channels" element={<Channels />} />
            <Route path="monthly-donations" element={<MonthlyDonations />} />
            <Route path="donations" element={<Donations />} />
            <Route path="payments" element={<Payments />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="journeys" element={<Journeys />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-right" />
      <MonthlyDonationNotification />
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Provider>
  );
}

export default App;
