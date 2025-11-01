import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Wrap = styled.div`
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
`;

const Card = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  backdrop-filter: saturate(120%) blur(2px);
`;

const Title = styled.h1`
  margin: 0 0 6px 0;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TitleBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #2563eb;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 12px;
  margin: 0 auto;
`;

const Subtitle = styled.div`
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  transition: box-shadow .2s ease, border-color .2s ease, transform .05s ease;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 4px rgba(67,97,238,0.15);
  }
  &:active { transform: translateY(0.5px); }
`;

const Button = styled.button`
  width: 100%;
  padding: 16px 20px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: transform .08s ease, box-shadow .2s ease, filter .2s ease;
  box-shadow: 0 8px 18px rgba(67,97,238,0.35);
  &:hover { filter: brightness(1.02); transform: translateY(-2px); box-shadow: 0 12px 24px rgba(67,97,238,0.4); }
  &:active { transform: translateY(1px) scale(0.995); }
`;

const ErrorText = styled.div`
  color: #dc2626;
  font-size: 12px;
  margin: 8px 0 0;
`;

const Login = () => {
  const { login, appName } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    if (!res.success) setError(res.message || 'Login failed');
    setLoading(false);
  };

  return (
    <Wrap>
      {/* Animated background orbs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ position: 'absolute', top: -120, left: -120, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,.25), transparent 60%)', pointerEvents: 'none' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: .1 }}
        style={{ position: 'absolute', bottom: -140, right: -140, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle at 60% 60%, rgba(16,185,129,.22), transparent 60%)', pointerEvents: 'none' }}
      />

      <Card
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        <Title>
          <TitleBadge>
            <i className="fas fa-hand-holding-heart" />
            <span>Sign in to {appName}</span>
          </TitleBadge>
        </Title>
        <Subtitle>NGO Management System</Subtitle>
        <form onSubmit={handleSubmit}>
          <div style={{display:'grid', gap:12}}>
            <div>
              <label>Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email"
                required 
              />
            </div>
            <div>
              <label>Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
              />
            </div>
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
          </div>
        </form>
      </Card>
    </Wrap>
  );
};

export default Login;
