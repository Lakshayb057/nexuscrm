const Setting = require('../models/Setting');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all page configurations
// @route   GET /api/settings/pages
// @access  Private/Admin
exports.getPageConfigs = asyncHandler(async (req, res, next) => {
  const settings = await Setting.findOne({});
  if (!settings) {
    return next(new ErrorResponse('Settings not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: settings.pages || []
  });
});

// @desc    Get single page configuration
// @route   GET /api/settings/pages/:pageName
// @access  Private/Admin
exports.getPageConfig = asyncHandler(async (req, res, next) => {
  const { pageName } = req.params;
  const settings = await Setting.findOne({});
  
  if (!settings) {
    return next(new ErrorResponse('Settings not found', 404));
  }
  
  const pageConfig = settings.pages.find(p => p.name === pageName);
  
  if (!pageConfig) {
    return next(new ErrorResponse(`Page configuration not found for ${pageName}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: pageConfig
  });
});

// @desc    Create or update page configuration
// @route   PUT /api/settings/pages/:pageName
// @access  Private/Admin
exports.updatePageConfig = asyncHandler(async (req, res, next) => {
  const { pageName } = req.params;
  const updates = req.body;
  
  const settings = await Setting.findOne({});
  if (!settings) {
    return next(new ErrorResponse('Settings not found', 404));
  }
  
  const pageIndex = settings.pages.findIndex(p => p.name === pageName);
  
  if (pageIndex === -1) {
    // Create new page config
    settings.pages.push({ ...updates, name: pageName });
  } else {
    // Update existing page config
    settings.pages[pageIndex] = { 
      ...settings.pages[pageIndex].toObject(), 
      ...updates 
    };
  }
  
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: settings.pages.find(p => p.name === pageName)
  });
});

// @desc    Reset page configuration to default
// @route   DELETE /api/settings/pages/:pageName/reset
// @access  Private/Admin
exports.resetPageConfig = asyncHandler(async (req, res, next) => {
  const { pageName } = req.params;
  
  // This would reset to default configuration
  // You would define default configurations for each page
  const defaultConfigs = {
    'contacts': {
      name: 'contacts',
      label: 'Contacts',
      icon: 'users',
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text', required: true, visible: true, order: 1 },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true, visible: true, order: 2 },
        { name: 'email', label: 'Email', type: 'email', required: true, visible: true, order: 3 },
        { name: 'phone', label: 'Phone', type: 'phone', required: false, visible: true, order: 4 },
        { name: 'gender', label: 'Gender', type: 'select', options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' }
        ], required: false, visible: true, order: 5 },
        { name: 'organization', label: 'Organization', type: 'text', required: false, visible: true, order: 6 }
      ],
      actions: {
        export: true,
        import: true,
        create: true,
        edit: true,
        delete: true,
        view: true,
        bulkActions: true
      },
      listView: {
        columns: [
          { field: 'firstName', label: 'First Name', visible: true, sortable: true, filterable: true },
          { field: 'lastName', label: 'Last Name', visible: true, sortable: true, filterable: true },
          { field: 'email', label: 'Email', visible: true, sortable: true, filterable: true },
          { field: 'phone', label: 'Phone', visible: true, sortable: true, filterable: true },
          { field: 'organization', label: 'Organization', visible: true, sortable: true, filterable: true },
          { field: 'createdAt', label: 'Created At', visible: true, sortable: true, filterable: true }
        ],
        defaultSort: { field: 'createdAt', order: 'desc' },
        itemsPerPage: 10
      },
      formLayout: {
        layout: 'vertical',
        gridColumns: 2,
        sections: [
          {
            title: 'Basic Information',
            fields: ['firstName', 'lastName', 'email', 'phone', 'gender', 'organization'],
            collapsible: false
          }
        ]
      }
    },
    // Add default configs for other pages similarly
  };
  
  const defaultConfig = defaultConfigs[pageName];
  
  if (!defaultConfig) {
    return next(new ErrorResponse(`No default configuration found for ${pageName}`, 400));
  }
  
  await Setting.updateOne(
    {},
    { 
      $pull: { pages: { name: pageName } },
      $push: { pages: defaultConfig }
    },
    { upsert: true }
  );
  
  res.status(200).json({
    success: true,
    data: defaultConfig
  });
});

// @desc    Get all available pages for settings
// @route   GET /api/settings/available-pages
// @access  Private/Admin
exports.getAvailablePages = asyncHandler(async (req, res, next) => {
  const availablePages = [
    { name: 'organizations', label: 'Organizations', icon: 'building' },
    { name: 'agencies', label: 'Agencies', icon: 'briefcase' },
    { name: 'channels', label: 'Channels', icon: 'share-2' },
    { name: 'contacts', label: 'Contacts', icon: 'users' },
    { name: 'monthly-donations', label: 'Monthly Donations', icon: 'repeat' },
    { name: 'onetime-donations', label: 'One-time Donations', icon: 'gift' },
    { name: 'payments', label: 'Payments', icon: 'credit-card' },
    { name: 'receipts', label: '80G Receipts', icon: 'file-text' },
    { name: 'campaigns', label: 'Campaigns', icon: 'target' },
    { name: 'journey-builder', label: 'Journey Builder', icon: 'map' },
    { name: 'reports', label: 'Reports', icon: 'bar-chart-2' },
    { name: 'users', label: 'User Management', icon: 'user' }
  ];
  
  res.status(200).json({
    success: true,
    data: availablePages
  });
});
