const rateLimit = require('express-rate-limit');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// In-memory store for rate limiting
const rateLimiterMemory = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
  blockDuration: 300, // block for 5 minutes if limit exceeded
});

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter (more strict)
exports.loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login attempts per hour
  message: 'Too many login attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 file uploads per hour
  message: 'Too many file uploads from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom rate limiter for specific endpoints
exports.customRateLimiter = (points = 100, duration = 60) => {
  return async (req, res, next) => {
    try {
      const rateLimiter = new RateLimiterMemory({
        points: points,
        duration: duration,
        blockDuration: duration * 2,
      });

      const clientIP = req.ip || req.connection.remoteAddress;
      await rateLimiter.consume(clientIP);
      next();
    } catch (error) {
      res.status(429).json({
        success: false,
        message: `Too many requests, please try again later.`,
        retryAfter: Math.ceil(error.msBeforeNext / 1000) || 1,
      });
    }
  };
};

// Rate limiter for password reset endpoints
exports.passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 password reset requests per windowMs
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for API key authentication
exports.apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each API key to 60 requests per minute
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.query.apiKey || 'no-key';
  },
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for public endpoints
exports.publicApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per hour
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
