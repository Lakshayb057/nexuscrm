const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, organization } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (organization) {
      query.organization = organization;
    }

    const users = await User.find(query)
      .populate('organization')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({ success: true, total, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, organization, permissions, manages } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const payload = {
      firstName,
      lastName,
      email,
      password,
      role,
      organization,
      permissions,
    };

    if (role === 'user') {
      if (!organization) {
        return res.status(400).json({ success: false, message: 'Organization is required for role user' });
      }
    } else {
      if (!organization) delete payload.organization;
    }

    if (role === 'manager' && Array.isArray(manages) && manages.length) {
      payload.manages = manages;
    }

    const user = await User.create(payload);
    await user.populate('organization');
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, password, role, organization, permissions, manages } = req.body || {};

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
      user.email = email;
    }

    if (typeof firstName !== 'undefined') user.firstName = firstName;
    if (typeof lastName !== 'undefined') user.lastName = lastName;
    if (typeof role !== 'undefined') user.role = role;

    // Determine the resulting role after update
    const finalRole = typeof role !== 'undefined' ? role : user.role;
    if (finalRole === 'user') {
      // Determine resulting organization: prefer provided value, otherwise keep existing
      const finalOrg = typeof organization !== 'undefined' ? organization : user.organization;
      if (!finalOrg) {
        return res.status(400).json({ success: false, message: 'Organization is required for role user' });
      }
      user.organization = finalOrg;
    } else {
      // For admin/manager: only change if explicitly provided
      if (typeof organization !== 'undefined') {
        if (organization) user.organization = organization; else user.organization = undefined;
      }
    }

    if (typeof permissions !== 'undefined') {
      user.permissions = permissions || {};
    }

    if (Array.isArray(manages)) {
      user.manages = manages;
    }

    if (password) {
      user.password = password;
    }

    await user.save();
    await user.populate('organization');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user && String(req.user._id) === String(id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
