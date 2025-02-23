require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const http = require('http');
const SocketService = require('./src/api/v1/chat/services/socket.service');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
const socketService = new SocketService(server);

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://localhost:3001',
        'https://quickotech.vercel.app',
        'https://quickotech-admin.vercel.app',
        '*'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verify environment variables
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Quickotech API Documentation',
            version: '1.0.0',
            description: 'API documentation for Quickotech Backend',
            contact: {
                name: 'API Support',
                email: 'support@quickotech.com'
            }
        },
        servers: [
            {
                url: 'https://quickotech-backend.onrender.com',
                description: 'Production server'
            },
            {
                url: 'http://localhost:10000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './src/api/v1/auth/routes/*.js',
        './src/api/v1/blog/*.routes.js',
        './src/api/v1/blog/routes/*.js',
        './src/api/v1/user/*.routes.js',
        './src/api/v1/user/routes/*.js',
        './src/api/v1/admin/routes/*.js',
        './src/api/v1/admin/*.routes.js',
        './src/api/v1/cyberCafe/routes/*.js'
    ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Quickotech API Documentation"
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        // Load models
        require('./src/api/v1/user/model/user.model');
        require('./src/api/v1/admin/model/product.model');
        require('./src/api/v1/blog/model/blog.model');
        
        // Initialize routes
        const authRoutes = require('./src/api/v1/auth/routes/auth.routes');
        const userRoutes = require('./src/api/v1/user/user.routes');
        const blogRoutes = require('./src/api/v1/blog/blog.routes');
        const productRoutes = require('./src/api/v1/admin/routes/product.routes');
        const orderRoutes = require('./src/api/v1/cyberCafe/routes/order.routes');

        // Register routes
        app.use('/api/v1/auth', authRoutes);
        app.use('/api/v1/users', userRoutes);
        app.use('/api/v1/blog', blogRoutes);
        app.use('/api/v1/admin/products', productRoutes);
        app.use('/api/v1/cyberCafe', orderRoutes);

        // Test route
        app.get('/', (req, res) => {
            res.json({
                message: 'Quickotech Backend API is running successfully.',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // Debug route to log request details
        app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });

        // 404 handler
        app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found'
            });
        });

        // Error handler
        app.use((err, req, res, next) => {
            console.error(err);
            res.status(err.statusCode || 500).json({
                success: false,
                error: err.message || 'Internal server error'
            });
        });

        // Start the server
        const port = process.env.PORT || 10000;
        const host = '0.0.0.0';
        
        server.listen(port, host, () => {
            console.log(`Server running on http://${host}:${port}`);
            console.log(`API Documentation available at http://${host}:${port}/api-docs`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// Export the Express app for Vercel
module.exports = app;