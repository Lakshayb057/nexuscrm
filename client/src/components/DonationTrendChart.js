import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styled, { useTheme } from 'styled-components';

const CustomTooltipContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const ChartContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBg};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ChartTitle = styled.h3`
  margin: 0 0 20px 0;
  color: ${({ theme }) => theme.colors.text};
`;

const DonationTrendChart = ({ donations, timeRange }) => {
  const theme = useTheme();
  // Group donations by date and calculate total amount for each date
  const prepareChartData = () => {
    const dateMap = new Map();
    
    donations.forEach(donation => {
      if (!donation.donationDate) return;
      
      // Format date to YYYY-MM-DD for grouping
      const date = new Date(donation.donationDate);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          amount: 0,
          count: 0
        });
      }
      
      const dayData = dateMap.get(dateKey);
      dayData.amount += donation.amount || 0;
      dayData.count += 1;
    });
    
    // Convert map to array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = prepareChartData();
  
  // Format X-axis tick based on time range
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    
    if (timeRange === 'yearly') {
      return date.toLocaleDateString('default', { month: 'short' });
    }
    
    if (timeRange === '3months' || timeRange === 'monthly') {
      return date.getDate() + ' ' + date.toLocaleDateString('default', { month: 'short' });
    }
    
    // For weekly or default
    return date.toLocaleDateString('default', { weekday: 'short', day: 'numeric' });
  };

  // Format tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <CustomTooltipContainer>
          <p style={{ 
            margin: '0 0 5px 0', 
            fontWeight: 'bold',
            color: theme.colors.text
          }}>
            {new Date(label).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
          <p style={{ 
            margin: '5px 0', 
            color: theme.colors.muted 
          }}>
            Donations: {payload[0].payload.count}
          </p>
          <p style={{ 
            margin: '5px 0', 
            color: theme.colors.success, 
            fontWeight: 'bold' 
          }}>
            Amount: ₹{payload[0].value.toLocaleString()}
          </p>
        </CustomTooltipContainer>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <ChartContainer>
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: theme.colors.text
        }}>
          <p>No donation data available for the selected period</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer>
      <ChartTitle>Donation Trends</ChartTitle>
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={theme.colors.border} 
              opacity={0.5}
            />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ 
                fill: theme.colors.muted, 
                fontSize: 12,
                fontFamily: 'inherit'
              }}
              axisLine={{ stroke: theme.colors.border }}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value.toLocaleString()}`}
              tick={{ 
                fill: theme.colors.muted, 
                fontSize: 12,
                fontFamily: 'inherit'
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ 
                stroke: theme.colors.primary, 
                strokeWidth: 1, 
                strokeDasharray: '3 3',
                opacity: 0.5
              }}
              contentStyle={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
                borderRadius: '4px',
                padding: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke={theme.colors.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 6, 
                stroke: theme.colors.primary, 
                strokeWidth: 2, 
                fill: theme.colors.bg 
              }}
              name="Donation Amount"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export default DonationTrendChart;
