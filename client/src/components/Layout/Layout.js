import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';

const Shell = styled.div`
  display: grid;
  grid-template-columns: ${({ collapsed }) => (collapsed ? '72px 1fr' : '260px 1fr')};
  min-height: 100vh;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TopBar = styled.header`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
`;

const Main = styled.main`
  padding: 16px;
  background: ${({ theme }) => theme.colors.appBg};
  min-height: calc(100vh - 56px);
`;

const MobileToggle = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.cardBg};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const DesktopToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  @media (max-width: 768px) {
    display: none;
  }
`;

const Overlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${({ open }) => (open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 5;
  }
`;

const Layout = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout, toggleTheme, theme, user } = useAuth();

  const handleViewChange = (view) => {
    if (view === 'logout') {
      logout();
      navigate('/login');
    } else {
      setActiveView(view);
      navigate(view === 'dashboard' ? '/' : `/${view}`);
    }
    setSidebarOpen(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Shell collapsed={sidebarCollapsed}>
      <Sidebar activeView={activeView} onViewChange={handleViewChange} open={sidebarOpen} collapsed={sidebarCollapsed} />
      <Overlay open={sidebarOpen} onClick={() => setSidebarOpen(false)} />
      <div>
        <TopBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MobileToggle onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
              <i className="fas fa-bars"></i>
            </MobileToggle>
            <DesktopToggle onClick={() => setSidebarCollapsed((v) => !v)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <i className={`fas ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
            </DesktopToggle>
            <Link to="/">Dashboard</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn" onClick={toggleTheme}>
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
            {user && (
              <span>Welcome, {user.firstName || user.name || user.email}</span>
            )}
          </div>
        </TopBar>
        <Main>
          <Outlet />
        </Main>
      </div>
    </Shell>
  );
};

export default Layout;
