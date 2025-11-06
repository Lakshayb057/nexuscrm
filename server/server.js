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

// ✅ FIXED CORS SETUP (MUST BE BEFORE ROUTES)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://nexuscrm-client.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors()); // ✅ Allow preflight for all routes

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Initialize Admin User
const initializeAdminUser = async () => {
  try {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminExists) {
        await new User({
          firstName: 'Admin',
          lastName: 'User',
          email: process.env.ADMIN_EMAIL.toLowerCase(),
          password: process.env.ADMIN_PASSWORD,
          role: 'admin',
          forcePasswordChange: true
        }).save();
        console.log('Admin user created from environment variables');
      }
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
    process.exit(1);
  }
};

// Debug request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Explicit auth route mount (as requested)
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// API Routes
const routes = [
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

routes.forEach(({ path, route }) => app.use(path, route));

// Root & health
app.get('/', (req, res) => res.send('🚀 NexusCRM API is running successfully!'));
app.get('/test', (req, res) => res.send('Test route working ✅'));
app.get('/health', (req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Can't find ${req.originalUrl} on this server!` });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  await initializeAdminUser();
});

module.exports = server;
