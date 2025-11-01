const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const createError = require('http-errors');

// Common validation rules
exports.commonRules = {
  email: body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  password: body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one special character'),
};

// Sanitization middleware
exports.sanitizeInput = (req, res, next) => {
  // Sanitize all string fields in the request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

// Validation result handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
  
  return next(createError(422, {
    message: 'Validation failed',
    errors: extractedErrors
  }));
};

// File upload validation
exports.validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next(createError(400, 'No file uploaded'));
  }
  
  // Check file type
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(createError(400, 'Invalid file type. Only Excel and CSV files are allowed.'));
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return next(createError(400, 'File size too large. Maximum size is 5MB.'));
  }
  
  next();
};
