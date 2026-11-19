require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const sampleProjects = [
  {
    title: 'Modern E-Commerce Platform',
    category: 'Commercial',
    status: 'completed',
    description:
      'A full-featured MERN stack e-commerce web application with product search, filtering, shopping cart, customer checkout, and a full admin dashboard for inventory management.',
    shortDescription:
      'Full-stack MERN e-commerce application with real-time stock management and order tracking.',
    location: 'Remote / Cloud Deployed',
    client: 'Apex Retailers',
    area: 'Full-Stack Web App',
    value: '₹3,50,000',
    coverImage: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&auto=format&fit=crop&q=80',
    tags: ['react', 'node', 'express', 'mongodb', 'redux'],
    featured: true,
    isPublished: true,
  },
  {
    title: 'Enterprise Business Portfolio & CRM',
    category: 'Commercial',
    status: 'completed',
    description:
      'Responsive company website with an integrated customer inquiry and lead management dashboard. Optimized for high Google PageSpeed score and SEO visibility.',
    shortDescription:
      'Modern corporate website and lead-capture platform with custom admin controls.',
    location: 'Mumbai, Maharashtra',
    client: 'Sterling Logistics',
    area: 'Web Portal',
    value: '₹1,80,000',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    tags: ['react', 'tailwind', 'rest-api', 'mongodb'],
    featured: true,
    isPublished: true,
  },
  {
    title: 'Industrial Equipment Inventory System',
    category: 'Industrial',
    status: 'ongoing',
    description:
      'Internal dashboard and REST API for real-time tracking of construction equipment, spare parts, and maintenance schedules across multiple warehouse locations.',
    shortDescription:
      'Scalable inventory management system with role-based access control and analytics.',
    location: 'Pune, Maharashtra',
    client: 'Vanguard Industrial Supply',
    area: 'Internal Tool / SaaS',
    value: '₹4,20,000',
    coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    tags: ['mern', 'jwt', 'dashboard', 'charts'],
    featured: true,
    isPublished: true,
  },
];

const runSeed = async () => {
  try {
    await connectDB();

    // Check or create Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL || 'admin@rahulenterprises.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        name: 'Administrator',
      });
      console.log('✅ Default admin account created');
    }

    // Seed Projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      for (const p of sampleProjects) {
        await Project.create(p);
      }
      console.log(`✅ Seeded ${sampleProjects.length} sample projects successfully`);
    } else {
      console.log(`ℹ️ Projects already present (${projectCount} found). Skipping project seed.`);
    }

    console.log('🌱 Seeding process complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

runSeed();
