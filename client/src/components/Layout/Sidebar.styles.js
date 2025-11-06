import styled from 'styled-components';

export const SidebarContainer = styled.aside`
  width: 260px;
  background: ${({ theme }) => theme.colors.sidebarBg};
  color: ${({ theme }) => theme.colors.text};
  height: 100vh;
  position: sticky;
  top: 0;
  padding: 16px;
  z-index: 10;

  /* Mobile drawer behavior */
  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(-100%)')};
    transition: transform 200ms ease;
    box-shadow: ${({ open }) => (open ? '0 0 0 9999px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2)' : 'none')};
  }
`;

export const SidebarHeader = styled.div`
  margin-bottom: 24px;
  h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; }
  span { font-weight: 700; }
`;

export const NavItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 6px;
  transition: background-color 0.2s;
  
  &:hover { 
    background: ${({ theme }) => theme.colors.primary + '18'}; 
  }
  
  &.active {
    background: ${({ theme }) => theme.colors.primary + '22'};
    font-weight: 600;
    
    i {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;
