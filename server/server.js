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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS BLOCKED:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contacts", require("./routes/contacts"));
// ... other routes
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
