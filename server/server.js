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

const app = express();

/* ✅ ALLOW MULTIPLE FRONTEND URLs (VERCEL + LOCALHOST) */
const allowedOrigins = [
  process.env.FRONTEND_URL,                           // → production URL
  "https://nexuscrm-client.vercel.app",              // → fallback production
  "http://localhost:3000",                           // → local dev
  /\.vercel\.app$/                                   // → ALL Vercel preview deployments (regex)
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://nexuscrm-client.vercel.app',
      /https:\/\/nexuscrm-client-.*\.vercel\.app$/
    ];
    
    if (allowedOrigins.some(regex => origin.match(regex))) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));


app.options("*", cors()); // ✅ Enable preflight

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// MongoDB connection...
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Admin user init...
const initializeAdminUser = async () => {
  try {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminExists) {
        await new User({
          firstName: "Admin",
          lastName: "User",
          email: process.env.ADMIN_EMAIL.toLowerCase(),
          password: process.env.ADMIN_PASSWORD,
          role: "admin",
          forcePasswordChange: true,
        }).save();
        console.log("Admin user created from environment variables");
      }
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
    process.exit(1);
  }
};

// Debug request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/agencies", require("./routes/agencies"));
app.use("/api/campaigns", require("./routes/campaigns"));
app.use("/api/channels", require("./routes/channels"));
app.use("/api/contacts", require("./routes/contacts"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/journeys", require("./routes/journeys"));
app.use("/api/organizations", require("./routes/organizations"));
app.use("/api/page-configs", require("./routes/pageConfigs"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/receipts", require("./routes/receipts"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/users", require("./routes/users"));

// Health check endpoint
app.get("/", (req, res) => res.send("🚀 NexusCRM API is running successfully!"));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Can't find ${req.originalUrl}` }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  await initializeAdminUser();
});
