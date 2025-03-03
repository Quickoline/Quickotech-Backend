// Import required modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:5500',
        'https://quickotech.vercel.app',
        'https://quickotech-admin.vercel.app',
        'https://quickoline.vercel.app',
        'https://quickotech-backend.vercel.app',
        '*'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Load models
require('../src/api/v1/user/model/user.model');
require('../src/api/v1/admin/model/product.model');
require('../src/api/v1/blog/model/blog.model');

// Initialize routes
const authRoutes = require('../src/api/v1/auth/routes/auth.routes');
const userRoutes = require('../src/api/v1/user/user.routes');
const blogRoutes = require('../src/api/v1/blog/blog.routes');
const productRoutes = require('../src/api/v1/admin/routes/product.routes');
const orderRoutes = require('../src/api/v1/cyberCafe/routes/order.routes');
const chatRoutes = require('../src/api/v1/chat/chat.routes');
const regexTemplateRoutes = require('../src/api/v1/admin/routes/regexTemplate.routes');

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/admin/products', productRoutes);
app.use('/api/v1/cyber-cafe', orderRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin/regex-templates', regexTemplateRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Quickotech Backend API is running successfully.',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        endpoints: {
            docs: '/api-docs',
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            blog: '/api/v1/blog',
            admin: '/api/v1/admin',
            cyberCafe: '/api/v1/cyber-cafe',
            chat: '/api/v1/chat'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// Export the Express app
module.exports = app; 