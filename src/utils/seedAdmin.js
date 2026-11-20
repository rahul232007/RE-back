const Admin = require('../models/Admin');

const seedDefaultAdmin = async () => {
  if (await Admin.count() > 0) return;
  await Admin.create({
    email: process.env.ADMIN_EMAIL || 'admin@rahulenterprises.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    name: 'Administrator',
  });
  console.log('👤 Default admin account created');
};

module.exports = { seedDefaultAdmin };
