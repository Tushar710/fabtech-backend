const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002', 
      'http://localhost:3003', 
      'http://localhost:3005',
      'https://vangangaaindustries.com',
      'https://kharefabtech.com', 
      'http://kharefabtech.com',
      'https://shivshambhuvivah.com', 
      'http://shivshambhuvivah.com',
      'https://www.shivshambhuvivah.com',
      'http://www.shivshambhuvivah.com'
    ];
    
    // Allow all origins for development/testing
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For production, allow all origins for now - you can restrict later
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fabtech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.get('/', (req, res) => {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const baseUrl = `${protocol}://${host}`;
  
  res.json({ 
    message: 'FABTECH CRM Backend Server Running',
    version: '1.0.0',
    host: host,
    baseUrl: baseUrl,
    endpoints: [
      'GET /api/leads - Get all leads',
      'POST /api/leads - Create lead',
      'PUT /api/leads/:id - Update lead',
      'DELETE /api/leads/:id - Delete lead',
      'GET /api/companies - Get all companies',
      'POST /api/companies - Create company',
      'GET /api/dropdown-options/:category - Get dropdown options',
      'GET /api/form-fields - Get form fields'
    ],
    supportedDomains: [
      'localhost:5001',
      'shivshambhuvivah.com',
      'kharefabtech.com',
      'vangangaaindustries.com'
    ]
  });
});

// Add API routes
app.use('/api/auth', require('./routes/auth'));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.headers.authorization) {
    console.log('Authorization header present');
  }
  next();
});

app.use('/api/company-auth', require('./routes/companyAuth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/lead-assignment', require('./routes/leadAssignment'));
app.use('/api/follow-up', require('./routes/followUp'));
app.use('/api/employee-performance', require('./routes/employeePerformance'));
app.use('/api/company-auth', require('./routes/companyAuth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/companies', require('./routes/companies'));
// app.use('/api/employees', require('./routes/employees')); // File not found
app.use('/api/follow-up', require('./routes/followUp'));
app.use('/api/dropdown-options', require('./routes/dropdownOptions'));
app.use('/api/form-fields', require('./routes/formFields'));
app.use('/api/employee-dashboard', require('./routes/employeeDashboard'));
app.use('/api/products', require('./routes/products'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/email', require('./routes/email')); // Route file not found
// app.use('/api/services', require('./routes/service')); // Route file not found
app.use('/api/employee-dashboard', require('./routes/employeeDashboard'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/lead-capture', require('./routes/leadCapture'));
app.use('/api/projects-with-sales-data', require('./routes/projectsWithSalesData'));
app.use('/api/whatsapp-simple', require('./routes/whatsappSimple'));
app.use('/api/whatsapp-settings', require('./routes/whatsappSettings'));
app.use('/api/dropdown-options', require('./routes/dropdownOptions'));
app.use('/api/catalogs', require('./routes/catalogs'));

// Employee Dashboard Routes
app.use('/api/employee-dashboard', require('./routes/employeeDashboard'));

// Branch and Employee Management Routes
app.use('/api/branches', require('./routes/branches'));
app.use('/api/branch-auth', require('./routes/branchAuth'));
app.use('/api/branch-tracking', require('./routes/branchTracking'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/employee-auth', require('./routes/employeeAuth'));
app.use('/api/department-leads', require('./routes/departmentLeads'));
app.use('/api/branch-admin', require('./routes/branchAdmin'));

// Task Management Routes
app.use('/api/tasks', require('./routes/tasks'));

// Reminder Routes
app.use('/api/reminders', require('./routes/reminders'));

// Self Reporting Routes
app.use('/api/self-reports', require('./routes/selfReports'));

// Product Management Routes
app.use('/api/product-categories', require('./routes/productCategory'));
app.use('/api/products', require('./routes/products'));

// Mobile API Routes
app.use('/api/mobile', require('./routes/mobileApi'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/leads`);
});

module.exports = app;
