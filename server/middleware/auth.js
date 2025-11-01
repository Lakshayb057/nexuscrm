const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).populate('organization');
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

// For non-admin users, set req.orgScope to the user's organization id (if present)
exports.scopeToOrg = (req, res, next) => {
  if (req.user && req.user.role !== 'admin' && req.user.organization) {
    req.orgScope = req.user.organization._id || req.user.organization;
  }
  next();
};

exports.checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    const permissions = req.user.permissions?.[resource];
    if (!permissions || !permissions[action]) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to ${action} ${resource}` 
      });
    }
    next();
  };
};
