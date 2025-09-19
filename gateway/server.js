require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8088;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));


// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes
const blogRoutes = require('./src/routes/blogRoutes');
const stakeholdersRoutes = require('./src/routes/stakeholdersRoutes');
const toursRoutes = require('./src/routes/toursRoutes');

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Gateway info
app.get('/info', (req, res) => {
  res.json({
    name: 'API Gateway',
    version: '1.0.0',
    services: ['blog', 'stakeholders', 'tours'],
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routes
app.use('/api/blog-service', blogRoutes);
app.use('/api/stakeholders-service', stakeholdersRoutes);
app.use('/api/tours-service', toursRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 404 handler
app.use('/', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: ['/api/blog-service', '/api/stakeholders-service', '/api/tours-service', '/health', '/info']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err.message);
  res.status(500).json({
    error: 'Internal gateway error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Gateway running on port ${PORT}`);
  console.log('📡 Services:');
  console.log(`   Blog: ${process.env.BLOG_SERVICE_URL || 'http://localhost:3000'}`);
  console.log(`   Stakeholders: ${process.env.STAKEHOLDERS_SERVICE_URL || 'http://localhost:4000'}`);
  console.log(`   Stakeholders gRPC: ${process.env.STAKEHOLDERS_GRPC_URL || 'http://localhost:4001'}`);
  console.log(`   Tours: ${process.env.TOURS_SERVICE_URL || 'http://localhost:5000'}`);
});