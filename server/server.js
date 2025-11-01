require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

// Create express app
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Initialize admin user
const initializeAdminUser = async () => {
  try {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminExists) {
        const adminUser = new User({
          firstName: 'Admin',
          lastName: 'User',
          email: process.env.ADMIN_EMAIL.toLowerCase(),
          password: process.env.ADMIN_PASSWORD,
          role: 'admin',
          forcePasswordChange: true
        });
        await adminUser.save();
        console.log('Admin user created from environment variables');
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('Admin credentials not set in environment variables. Run the setup script to create an admin user.');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
    process.exit(1);
  }
};

// API Routes
const routes = [
  { path: '/api/auth', route: require('./routes/auth') },
  { path: '/api/contacts', route: require('./routes/contacts') },
  { path: '/api/organizations', route: require('./routes/organizations') },
  { path: '/api/agencies', route: require('./routes/agencies') },
  { path: '/api/channels', route: require('./routes/channels') },
  { path: '/api/donations', route: require('./routes/donations') },
  { path: '/api/payments', route: require('./routes/payments') },
  { path: '/api/receipts', route: require('./routes/receipts') },
  { path: '/api/settings/pages', route: require('./routes/pageConfig') },
  { path: '/api/campaigns', route: require('./routes/campaigns') },
  { path: '/api/users', route: require('./routes/users') },
  { path: '/api/journeys', route: require('./routes/journeys') },
  { path: '/api/reports', route: require('./routes/reports') },
  { path: '/api/settings', route: require('./routes/settings') },
];

// Apply routes
routes.forEach(({ path, route }) => {
  app.use(path, route);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'NexusCRM API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Error handling middleware (must be after all other middleware and routes)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  try {
    await initializeAdminUser();
    
    // Initialize journey scheduler if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      try {
        const { startJourneyScheduler } = require('./services/journeyScheduler');
        await startJourneyScheduler();
        console.log('Journey scheduler started');
      } catch (err) {
        console.warn('Could not start journey scheduler:', err.message);
      }
    }
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

module.exports = server;
