// Import required modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Cache middleware
const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, s-maxage=${duration}, stale-while-revalidate`);
        }
        next();
    };
};

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

// Improved MongoDB connection for serverless with connection pooling
let cachedDb = null;
const connectTimeoutMS = 5000;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        console.log('Using cached database connection');
        return cachedDb;
    }

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false,
            serverSelectionTimeoutMS: connectTimeoutMS,
            socketTimeoutMS: connectTimeoutMS,
            family: 4,
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 10000
        });

        cachedDb = db;
        console.log('New database connection established');

        // Handle connection errors
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            cachedDb = null;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            cachedDb = null;
        });

        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

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

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed'
        });
    }
});

// Apply caching to routes
app.use('/api/v1/blog', cacheMiddleware(30), blogRoutes);
app.use('/api/v1/admin/products', cacheMiddleware(60), productRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cyber-cafe', orderRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin/regex-templates', regexTemplateRoutes);

// Root route with connection status and caching
app.get('/', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');
    res.json({
        success: true,
        message: 'Quickotech Backend API is running successfully.',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        status: {
            database: dbStatus,
            server: 'running',
            region: process.env.VERCEL_REGION || 'unknown'
        },
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

// Error handling middleware with detailed logging
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Export the Express app
module.exports = app; 