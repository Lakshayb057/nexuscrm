const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const setupAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Enter admin email: ', async (email) => {
      const password = await new Promise(resolve => {
        readline.question('Enter admin password (min 12 characters): ', resolve);
      });

      if (password.length < 12) {
        console.error('Error: Password must be at least 12 characters long');
        process.exit(1);
      }

      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: email.toLowerCase() });
      
      if (existingAdmin) {
        console.log('Admin user already exists. Updating password...');
        existingAdmin.password = password;
        existingAdmin.forcePasswordChange = true;
        await existingAdmin.save();
        console.log('Admin password updated successfully');
      } else {
        // Create new admin user
        const hashedPassword = await bcrypt.hash(password, 12);
        const adminUser = new User({
          firstName: 'Admin',
          lastName: 'User',
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'admin',
          forcePasswordChange: false,
          isVerified: true
        });

        await adminUser.save();
        console.log('Admin user created successfully');
      }

      readline.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error setting up admin user:', error);
    process.exit(1);
  }
};

setupAdminUser();
