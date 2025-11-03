import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
  z-index: 1000;
`;

const Logo = styled(motion.div)`
  width: 120px;
  height: 120px;
  background: white;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  margin-bottom: 24px;
  
  svg {
    width: 70%;
    height: 70%;
  }
`;

const DotContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 24px;
`;

const Dot = styled(motion.span)`
  display: block;
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
`;

const LoadingAnimation = ({ isLoading }) => {
  if (!isLoading) return null;

  const dots = [
    { delay: 0 },
    { delay: 0.2 },
    { delay: 0.4 },
  ];

  return (
    <Container
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Logo
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#3a0ca3"/>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="white"/>
          <path d="M12 7C12.5523 7 13 6.55228 13 6C13 5.44772 12.5523 5 12 5C11.4477 5 11 5.44772 11 6C11 6.55228 11.4477 7 12 7Z" fill="white"/>
          <path d="M12 19C12.5523 19 13 18.5523 13 18C13 17.4477 12.5523 17 12 17C11.4477 17 11 17.4477 11 18C11 18.5523 11.4477 19 12 19Z" fill="white"/>
          <path d="M7.05025 9.05025C7.44077 8.65973 8.07394 8.65973 8.46446 9.05025C8.85499 9.44078 8.85499 10.0739 8.46446 10.4645C8.07394 10.855 7.44077 10.855 7.05025 10.4645C6.65973 10.0739 6.65973 9.44078 7.05025 9.05025Z" fill="white"/>
          <path d="M15.5355 13.5355C15.9261 13.145 16.5592 13.145 16.9497 13.5355C17.3403 13.9261 17.3403 14.5592 16.9497 14.9497C16.5592 15.3403 15.9261 15.3403 15.5355 14.9497C15.145 14.5592 15.145 13.9261 15.5355 13.5355Z" fill="white"/>
          <path d="M7.05025 14.9497C7.44077 14.5592 8.07394 14.5592 8.46446 14.9497C8.85499 15.3403 8.85499 15.9734 8.46446 16.364C8.07394 16.7545 7.44077 16.7545 7.05025 16.364C6.65973 15.9734 6.65973 15.3403 7.05025 14.9497Z" fill="white"/>
          <path d="M15.5355 9.05025C15.9261 8.65973 16.5592 8.65973 16.9497 9.05025C17.3403 9.44078 17.3403 10.0739 16.9497 10.4645C16.5592 10.855 15.9261 10.855 15.5355 10.4645C15.145 10.0739 15.145 9.44078 15.5355 9.05025Z" fill="white"/>
        </svg>
      </Logo>
      
      <motion.h2 
        style={{ color: 'white', marginBottom: '24px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Nexus CRM
      </motion.h2>
      
      <DotContainer>
        {dots.map((dot, index) => (
          <Dot
            key={index}
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: dot.delay,
              ease: 'easeInOut'
            }}
          />
        ))}
      </DotContainer>
    </Container>
  );
};

export default LoadingAnimation;
