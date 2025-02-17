require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const http = require('http');
const SocketService = require('./src/api/v1/chat/services/socket.service');
const cors = require('cors');
const { checkS3Config } = require('./src/config/aws');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
const socketService = new SocketService(server);

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:58480',
        'http://10.0.2.2:3000',    // Android emulator
        'http://10.0.2.2:8081',    // React Native default
        'http://10.0.2.2',         // Android emulator base URL
        'capacitor://localhost',   // Capacitor
        'ionic://localhost',       // Ionic
        '*'                        // Allow all origins for development
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    maxAge: 86400
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
                url: process.env.FRONTEND_URL || 'http://localhost:3000',
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
        ],
        tags: [
            { 
                name: 'Auth', 
                description: 'Authentication endpoints' 
            },
            { 
                name: 'Chat', 
                description: 'Real-time chat system (Requires App Admin or higher for admin functions)' 
            },
            { 
                name: 'Blog', 
                description: 'Blog management (GET endpoints public, others require Web Admin)' 
            },
            { 
                name: 'Products', 
                description: 'Product management (Requires Senior Admin)' 
            },
            { 
                name: 'Templates', 
                description: 'Template management (Requires Senior Admin)' 
            },
            { 
                name: 'Users', 
                description: 'User management (Various admin levels required)' 
            }
        ]
    },
    apis: [
        './src/api/v1/auth/routes/*.js',
        './src/api/v1/chat/*.routes.js',
        './src/api/v1/chat/routes/*.js',
        './src/api/v1/cyberCafe/routes/*.js',
        './src/api/v1/blog/*.routes.js',
        './src/api/v1/blog/routes/*.js',
        './src/api/v1/user/*.routes.js',
        './src/api/v1/user/routes/*.js',
        './src/api/v1/admin/routes/*.js',
        './src/api/v1/admin/*.routes.js'
    ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Quickotech API Documentation",
    customfavIcon: "/assets/favicon.ico",
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showCommonExtensions: true
    }
}));

// Connect to MongoDB first, then load models and start server
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        // Load models
        require('./src/api/v1/user/model/user.model');
        require('./src/api/v1/admin/model/product.model');
        require('./src/api/v1/blog/model/blog.model');
        require('./src/api/v1/chat/model/chat.model');
        
        // Initialize routes
        const authRoutes = require('./src/api/v1/auth/routes/auth.routes');
        const orderRoutes = require('./src/api/v1/cyberCafe/routes/order.routes');
        const chatRoutes = require('./src/api/v1/chat/chat.routes');
        const userRoutes = require('./src/api/v1/user/user.routes');
        const blogRoutes = require('./src/api/v1/blog/blog.routes');
        const notificationRoutes = require('./src/api/v1/admin/routes/notification.routes');
        const templateRoutes = require('./src/api/v1/admin/routes/template.routes');
        const productRoutes = require('./src/api/v1/admin/routes/product.routes');
        const regexTemplateRoutes = require('./src/api/v1/admin/routes/regexTemplate.routes');

        // Register routes
        app.use('/api/v1/auth', authRoutes);
        app.use('/api/v1/cyber-cafe', orderRoutes);
        app.use('/api/v1/chat', chatRoutes);
        app.use('/api/v1/users', userRoutes);
        app.use('/api/v1/blog', blogRoutes);
        app.use('/api/v1/admin/notifications', notificationRoutes);
        app.use('/api/v1/admin/templates', templateRoutes);
        app.use('/api/v1/admin/products', productRoutes);
        app.use('/api/v1/admin/regex-templates', regexTemplateRoutes);

        // Serve chat test page
        app.get('/chat-test', (req, res) => {
            res.sendFile(path.join(__dirname, './src/api/v1/chat/test/chat.html'));
        });

        // Test route
        app.get('/', (req, res) => {
            res.json({
                message: 'Hello Quicko! Server is running successfully.',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            });
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

        try {
            // Verify S3 configuration
            await checkS3Config();
            console.log('S3 configuration verified successfully');
            
            // Start server only once
            server.listen(process.env.PORT || 3000, () => {
                console.log(`Server running on port ${process.env.PORT || 3000}`);
                console.log(`API Documentation available at http://localhost:${process.env.PORT || 3000}/api-docs`);
            });
        } catch (error) {
            console.error('Server startup error:', error);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});