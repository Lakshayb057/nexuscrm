import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import { NavItem, SidebarContainer, SidebarHeader } from './Sidebar.styles';

const Sidebar = ({ activeView, onViewChange, open }) => {
  const { hasPermission, user, appName } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: 'fas fa-home', label: 'Dashboard', permission: 'dashboard' },
    { id: 'organizations', icon: 'fas fa-building', label: 'Organizations', permission: 'organizations' },
    { id: 'agencies', icon: 'fas fa-handshake', label: 'Agencies', permission: 'agencies' },
    { id: 'channels', icon: 'fas fa-satellite-dish', label: 'Channels', permission: 'channels' },
    { id: 'contacts', icon: 'fas fa-users', label: 'Contacts', permission: 'contacts' },
    { id: 'monthly-donations', icon: 'fas fa-calendar-check', label: 'Monthly Donations', permission: 'monthlyDonations' },
    { id: 'donations', icon: 'fas fa-donate', label: 'One-time Donations', permission: 'donations' },
    { id: 'payments', icon: 'fas fa-credit-card', label: 'Payments', permission: 'payments' },
    { id: 'receipts', icon: 'fas fa-receipt', label: '80G Receipts', permission: 'receipts' },
    { id: 'campaigns', icon: 'fas fa-bullhorn', label: 'Campaigns', permission: 'campaigns' },
    { id: 'journeys', icon: 'fas fa-project-diagram', label: 'Journey Builder', permission: 'journeys' },
    { id: 'reports', icon: 'fas fa-chart-bar', label: 'Reports', permission: 'reports' },
    { id: 'users', icon: 'fas fa-user-cog', label: 'User Management', permission: 'users' },
    { id: 'settings', icon: 'fas fa-cog', label: 'Settings', permission: 'settings' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'users') {
      return user?.role === 'admin';
    }
    return hasPermission(item.permission, 'read');
  });

  // Get the current path to determine active item
  const location = useLocation();
  const getActiveView = (pathname) => {
    const path = pathname.split('/').filter(Boolean);
    return path[0] === 'dashboard' ? (path[1] || 'dashboard') : 'dashboard';
  };

  return (
    <SidebarContainer open={open}>
      <SidebarHeader>
        <h2><i className="fas fa-hand-holding-heart"></i> <span>{appName}</span></h2>
      </SidebarHeader>
      {filteredMenuItems.map(item => (
        <NavItem
          key={item.id}
          as={NavLink}
          to={item.id === 'dashboard' ? '/dashboard' : `/dashboard/${item.id}`}
          className={getActiveView(location.pathname) === item.id ? 'active' : ''}
          onClick={() => onViewChange(item.id)}
        >
          <i className={item.icon}></i> <span>{item.label}</span>
        </NavItem>
      ))}
      <NavItem as="button" onClick={() => onViewChange('logout')}>
        <i className="fas fa-sign-out-alt"></i> <span>Logout</span>
      </NavItem>
    </SidebarContainer>
  );
};

export default Sidebar;
