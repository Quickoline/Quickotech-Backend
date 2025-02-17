const Review = require('../models/review.model');
const Finalized = require('../models/finalized.model');
const orderService = require('../services/order.service');
const { NotFoundError, ValidationError } = require('../../../../middleware/error/errorTypes');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer();
const Product = require('../../admin/model/product.model');

// Create a single instance of the controller
const orderController = {
    // Create new order
    createOrder: async (req, res) => {
        try {
            console.log('Raw Request body:', req.body);
            console.log('Files:', req.files);

            if (!req.body.serviceId) {
                throw new Error('serviceId is required');
            }

            if (!req.files || req.files.length === 0) {
                throw new Error('At least one document file is required');
            }

            // First, get the service to access its additionalFields configuration
            const service = await Product.findById(req.body.serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

            // Get additionalFields configuration from service
            const serviceFields = service.additionalFields instanceof Map 
                ? Object.fromEntries(service.additionalFields)
                : (typeof service.additionalFields === 'object' ? service.additionalFields : {});

            console.log('Service Fields:', serviceFields);

            // Parse documents array from the request body
            let documents = [];
            if (typeof req.body.documents === 'string') {
                try {
                    documents = JSON.parse(req.body.documents);
                } catch (e) {
                    documents = [{ documentName: req.body['documents[0][documentName]'], ocrData: req.body['documents[0][ocrData]'] }];
                }
            } else if (Array.isArray(req.body.documents)) {
                documents = req.body.documents;
            } else if (req.body['documents[0][documentName]']) {
                documents = [{
                    documentName: req.body['documents[0][documentName]'],
                    ocrData: req.body['documents[0][ocrData]']
                }];
            }

            // Parse additional fields from the request body
            const additionalFields = [];

            // Log all request body keys for debugging
            console.log('All request body keys:', Object.keys(req.body));

            // Process additional fields from the request body
            Object.keys(req.body).forEach(key => {
                // Match both array format and direct field format
                if (key.startsWith('additionalFields[') || key === 'emergency_contact') {
                    let fieldName, fieldValue;
                    
                    if (key.startsWith('additionalFields[')) {
                        const matches = key.match(/additionalFields\[(\d+)\]\[(\w+)\]/);
                        if (matches) {
                            const [, index, prop] = matches;
                            fieldName = req.body[`additionalFields[${index}][fieldName]`] || prop;
                            fieldValue = req.body[`additionalFields[${index}][fieldValue]`];
                        }
                    } else {
                        fieldName = key;
                        fieldValue = req.body[key];
                    }

                    console.log(`Processing field - Name: ${fieldName}, Value: ${fieldValue}`);

                    // Check if this field is configured in the service
                    const fieldConfig = serviceFields[fieldName];
                    if (fieldName && fieldValue && fieldConfig) {
                        console.log('Field config:', fieldConfig);

                        // Check if this field hasn't been added yet
                        if (!additionalFields.some(f => f.fieldName === fieldName)) {
                            additionalFields.push({
                                fieldName,
                                fieldValue: fieldValue.trim(),
                                fieldType: fieldConfig.type || 'text'
                            });
                        }
                    }
                }
            });

            console.log('Processed additionalFields:', additionalFields);

            // Prepare order data
            const orderData = {
                userId: req.user.id,
                serviceId: req.body.serviceId,
                documents: documents,
                files: req.files,
                status: (req.body.status || 'pending').trim(),
                trackingStatus: (req.body.trackingStatus || 'Order Placed').trim(),
                chatStatus: (req.body.chatStatus || 'Enabled').trim(),
                approveStatus: (req.body.approveStatus || 'Disabled').trim(),
                additionalFields: additionalFields
            };

            console.log('Final order data:', JSON.stringify(orderData, null, 2));

            const savedOrder = await orderService.createOrder(orderData);
            
            res.status(201).json({
                success: true,
                data: savedOrder
            });
        } catch (error) {
            console.error('Order creation error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get my orders
    getMyOrders: async (req, res) => {
        try {
            const orders = await orderService.getOrderHistory(req.user.id, req.query);
            res.json({
                success: true,
                data: orders
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Review.findById(req.params.orderId)
                .populate('serviceId')
                .populate('userId', '-password');
                
            if (!order) {
                throw new NotFoundError('Order not found');
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get all orders (admin)
    getAllOrders: async (req, res) => {
        try {
            const orders = await Review.find()
                .populate('serviceId')
                .populate('userId', '-password')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: orders
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    // Update order status (for admin)
    updateOrderStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { action } = req.body;

            // Verify admin role
            if (!req.user.role.includes('app_admin')) {
                throw new ValidationError('Only admins can update order status');
            }

            const order = await Review.findById(orderId);
            if (!order) {
                throw new NotFoundError('Order not found');
            }

            let statusUpdate = {};
            switch (action) {
                case 'start_processing':
                    if (order.status !== 'pending') {
                        throw new ValidationError('Only pending orders can be processed');
                    }
                    statusUpdate = {
                        status: 'processing',
                        trackingStatus: 'Processing Started'
                    };
                    break;

                case 'complete_order':
                    if (order.status !== 'processing') {
                        throw new ValidationError('Only processing orders can be completed');
                    }
                    statusUpdate = {
                        status: 'completed',
                        trackingStatus: 'Ready for Review'
                    };
                    break;

                default:
                    throw new ValidationError('Invalid action');
            }

            const updatedOrder = await Review.findByIdAndUpdate(
                orderId,
                { 
                    $set: statusUpdate,
                    $push: { 
                        statusHistory: {
                            status: statusUpdate.status,
                            trackingStatus: statusUpdate.trackingStatus,
                            updatedBy: req.user.id,
                            updatedAt: new Date()
                        }
                    }
                },
                { new: true }
            )
            .populate('serviceId')
            .populate('userId', '-password');

            res.json({
                success: true,
                data: updatedOrder
            });

        } catch (error) {
            console.error('Status update error:', error);
            res.status(error.status || 400).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get order status history
    getOrderStatusHistory: async (req, res) => {
        try {
            const { orderId } = req.params;
            
            const order = await Review.findById(orderId)
                .populate('statusHistory.updatedBy', 'name email')
                .select('statusHistory');

            if (!order) {
                throw new NotFoundError('Order not found');
            }

            res.json({
                success: true,
                data: order.statusHistory
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get order history
    getOrderHistory: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const orderHistory = await Finalized.find({ userId })
                .sort({ createdAt: -1 })
                .populate('serviceId');

            res.json({
                success: true,
                data: orderHistory
            });
        } catch (error) {
            next(error);
        }
    },

    // User approves order
    approveOrder: async (req, res, next) => {
        try {
            const { orderId } = req.params;
            const { orderIdentifier, selectorField } = req.body;

            const reviewOrder = await Review.findOne({ 
                _id: orderId,
                userId: req.user.id
            });
            
            if (!reviewOrder) {
                throw new NotFoundError('Order not found');
            }

            const finalizedOrder = new Finalized({
                userId: reviewOrder.userId,
                serviceId: reviewOrder.serviceId,
                documents: reviewOrder.documents,
                orderIdentifier,
                selectorField,
                trackingStatus: 'Approved'
            });

            await finalizedOrder.save();
            await Review.findByIdAndDelete(orderId);

            res.json({
                success: true,
                data: finalizedOrder
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin updates review
    updateOrderReview: async (req, res, next) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;

            const order = await Review.findById(orderId);
            if (!order) {
                throw new NotFoundError('Order not found');
            }

            order.trackingStatus = status;
            const updatedOrder = await order.save();

            res.json({
                success: true,
                data: updatedOrder
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin gets user orders
    getUserOrders: async (req, res, next) => {
        try {
            const { userId } = req.params;
            
            const [reviewOrders, finalizedOrders] = await Promise.all([
                Review.find({ userId }).sort({ createdAt: -1 }).populate('serviceId'),
                Finalized.find({ userId }).sort({ createdAt: -1 }).populate('serviceId')
            ]);

            res.json({
                success: true,
                data: {
                    inReview: reviewOrders,
                    finalized: finalizedOrders
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Finalize order (for regular users)
    finalizeOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            
            // Check if user is an admin
            if (req.user.role.includes('admin') || req.user.role.includes('app_admin')) {
                throw new ValidationError('Admins are not allowed to finalize orders');
            }

            // Find the review order
            const reviewOrder = await Review.findById(orderId)
                .populate('serviceId')
                .populate('userId');

            if (!reviewOrder) {
                throw new NotFoundError('Order not found');
            }

            // Verify order belongs to the requesting user
            if (reviewOrder.userId._id.toString() !== req.user.id) {
                throw new ValidationError('Not authorized to finalize this order');
            }

            // Create finalized order
            const finalizedOrder = new Finalized({
                userId: reviewOrder.userId._id,
                serviceId: reviewOrder.serviceId._id,
                documents: reviewOrder.documents,
                orderIdentifier: '',
                selectorField: '',
                trackingStatus: 'Approved',
                approvedAt: new Date()
            });

            // Save finalized order
            const savedFinalizedOrder = await finalizedOrder.save();

            // Update review order to mark it as finalized instead of deleting
            const updatedReviewOrder = await Review.findByIdAndUpdate(
                orderId,
                { 
                    $set: {
                        status: 'finalized',
                        trackingStatus: 'Order Finalized'
                    },
                    $push: { 
                        statusHistory: {
                            status: 'finalized',
                            trackingStatus: 'Order Finalized',
                            updatedBy: req.user.id,
                            updatedAt: new Date()
                        }
                    }
                },
                { new: true }
            )
            .populate('serviceId')
            .populate('userId', '-password');

            // Return both orders
            res.status(200).json({
                success: true,
                message: 'Order finalized successfully',
                data: {
                    finalizedOrder: savedFinalizedOrder,
                    reviewOrder: updatedReviewOrder
                }
            });

        } catch (error) {
            console.error('Order finalization error:', error);
            if (error instanceof ValidationError || error instanceof NotFoundError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    // Get all review orders
    getReviewOrders: async (req, res) => {
        try {
            let query = {};
            
            // If user is not admin, only show their orders
            if (!req.user.role.includes('app_admin')) {
                query.userId = req.user.id;
            }

            // Add pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Add status filter if provided
            if (req.query.status) {
                query.status = req.query.status;
            }

            const orders = await Review.find(query)
                .populate('serviceId')
                .populate('userId', '-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Review.countDocuments(query);

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        total,
                        page,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get review orders error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get all finalized orders
    getFinalizedOrders: async (req, res) => {
        try {
            let query = {};
            
            // If user is not admin, only show their orders
            if (!req.user.role.includes('app_admin')) {
                query.userId = req.user.id;
            }

            // Add pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const orders = await Finalized.find(query)
                .populate('serviceId')
                .populate('userId', '-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Finalized.countDocuments(query);

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        total,
                        page,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get finalized orders error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get single review order by ID
    getReviewOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;
            let order = await Review.findById(orderId)
                .populate('serviceId')
                .populate('userId', '-password');

            if (!order) {
                throw new NotFoundError('Order not found');
            }

            // Check if user has permission to view this order
            if (!req.user.role.includes('app_admin') && 
                order.userId._id.toString() !== req.user.id) {
                throw new ValidationError('Not authorized to view this order');
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            console.error('Get review order error:', error);
            res.status(error.status || 500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get single finalized order by ID
    getFinalizedOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;
            let order = await Finalized.findById(orderId)
                .populate('serviceId')
                .populate('userId', '-password');

            if (!order) {
                throw new NotFoundError('Order not found');
            }

            // Check if user has permission to view this order
            if (!req.user.role.includes('app_admin') && 
                order.userId._id.toString() !== req.user.id) {
                throw new ValidationError('Not authorized to view this order');
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            console.error('Get finalized order error:', error);
            res.status(error.status || 500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Update OCR data for documents
    updateOcrData: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { documents } = req.body;

            if (!Array.isArray(documents)) {
                throw new ValidationError('Documents must be an array');
            }

            const order = await Review.findById(orderId);
            if (!order) {
                throw new NotFoundError('Order not found');
            }

            // Update OCR data for each document
            for (const doc of documents) {
                const documentIndex = order.documents.findIndex(
                    d => d._id.toString() === doc.documentId
                );

                if (documentIndex === -1) {
                    throw new ValidationError(`Document with ID ${doc.documentId} not found in order`);
                }

                // Update OCR data
                order.documents[documentIndex].ocrData = {
                    ...order.documents[documentIndex].ocrData,
                    ...doc.ocrData,
                    lastUpdated: new Date()
                };
            }

            // Save the updated order
            const updatedOrder = await order.save();

            res.json({
                success: true,
                data: updatedOrder
            });

        } catch (error) {
            console.error('OCR update error:', error);
            res.status(error.status || 500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Update order statuses
    updateOrderStatuses: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status, trackingStatus, chatStatus, approveStatus } = req.body;

            const order = await Review.findById(orderId);
            if (!order) {
                throw new NotFoundError('Order not found');
            }

            // Create update object with only provided fields
            const updateFields = {};
            if (status) {
                if (!Review.schema.path('status').enumValues.includes(status)) {
                    throw new ValidationError(`Invalid status: ${status}`);
                }
                updateFields.status = status;
            }

            if (trackingStatus) {
                if (!Review.schema.path('trackingStatus').enumValues.includes(trackingStatus)) {
                    throw new ValidationError(`Invalid tracking status: ${trackingStatus}`);
                }
                updateFields.trackingStatus = trackingStatus;
            }

            if (chatStatus) {
                if (!Review.schema.path('chatStatus').enumValues.includes(chatStatus)) {
                    throw new ValidationError(`Invalid chat status: ${chatStatus}`);
                }
                updateFields.chatStatus = chatStatus;
            }

            if (approveStatus) {
                if (!Review.schema.path('approveStatus').enumValues.includes(approveStatus)) {
                    throw new ValidationError(`Invalid approve status: ${approveStatus}`);
                }
                updateFields.approveStatus = approveStatus;
            }

            // Add to status history
            const statusHistoryEntry = {
                status: updateFields.status || order.status,
                trackingStatus: updateFields.trackingStatus || order.trackingStatus,
                chatStatus: updateFields.chatStatus || order.chatStatus,
                approveStatus: updateFields.approveStatus || order.approveStatus,
                updatedBy: req.user.id,
                updatedAt: new Date()
            };

            // Update the order with new fields and push to status history
            const updatedOrder = await Review.findByIdAndUpdate(
                orderId,
                {
                    $set: updateFields,
                    $push: { statusHistory: statusHistoryEntry }
                },
                { 
                    new: true,
                    runValidators: true 
                }
            ).populate('serviceId');

            res.json({
                success: true,
                data: updatedOrder
            });

        } catch (error) {
            console.error('Status update error:', error);
            res.status(error.status || 500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = orderController;