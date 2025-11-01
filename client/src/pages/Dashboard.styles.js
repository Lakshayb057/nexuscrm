import styled, { css } from 'styled-components';

export const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

export const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 16px;
`;

export const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.primary + '22'};
  color: ${({ theme }) => theme.colors.primary};
`;

export const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
`;

export const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 13px;
`;

export const StatChange = styled.div`
  font-size: 12px;
  margin-top: 4px;
  color: ${({ positive, negative, theme }) => 
    positive ? theme.colors.success : 
    negative ? theme.colors.error : 
    theme.colors.muted};
  &.text-danger { color: #dc2626; }
`;

// New styles for donations table and tabs
export const SectionContainer = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: ${({ theme }) => theme.colors.text};
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 12px;
`;

export const TabButton = styled.button`
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.muted};
  border-bottom: 2px solid ${({ theme, active }) => active ? theme.colors.primary : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const DonationsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

export const TableHeader = styled.thead`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

export const TableCell = styled.td`
  padding: 16px;
  text-align: left;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  
  ${({ header }) => header && css`
    font-weight: 600;
    text-transform: uppercase;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.muted};
  `}
`;

export const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  ${({ type }) => type === 'monthly' && css`
    background: #e3f2fd;
    color: #1976d2;
  `}
  
  ${({ type }) => type === 'one-time' && css`
    background: #e8f5e9;
    color: #2e7d32;
  `}
  
  ${({ type }) => type === 'success' && css`
    background: #e8f5e9;
    color: #2e7d32;
  `}
  
  ${({ type }) => type === 'warning' && css`
    background: #fff8e1;
    color: #ff8f00;
  `}
  
  ${({ type }) => type === 'error' && css`
    background: #ffebee;
    color: #c62828;
  `}
  
  ${({ type }) => type === 'default' && css`
    background: #f5f5f5;
    color: #757575;
  `}
`;

export const ActionButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;
