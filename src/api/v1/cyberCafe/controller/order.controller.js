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

            // First, get the service to access its additionalFields configuration
            const service = await Product.findById(req.body.serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

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
            let additionalFields = [];
            if (req.body.additionalFields) {
                try {
                    // If it's a string (JSON), parse it
                    if (typeof req.body.additionalFields === 'string') {
                        const parsedFields = JSON.parse(req.body.additionalFields);
                        if (typeof parsedFields === 'object' && !Array.isArray(parsedFields)) {
                            additionalFields = Object.entries(parsedFields).map(([fieldName, fieldValue]) => ({
                                fieldName,
                                fieldValue,
                                fieldType: typeof fieldValue === 'number' ? 'number' : 'text'
                            }));
                        }
                    }
                    // If it's already an object
                    else if (typeof req.body.additionalFields === 'object' && !Array.isArray(req.body.additionalFields)) {
                        additionalFields = Object.entries(req.body.additionalFields).map(([fieldName, fieldValue]) => ({
                            fieldName,
                            fieldValue,
                            fieldType: typeof fieldValue === 'number' ? 'number' : 'text'
                        }));
                    }
                } catch (error) {
                    console.error('Error parsing additional fields:', error);
                }
            }

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
            const orders = await Review.find({ userId: req.user.id })
                .populate({
                    path: 'serviceId',
                    select: '_id title description price category requiredDocuments customDropdowns applicationDetails additionalFields'
                })
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

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Review.findById(req.params.orderId)
                .populate({
                    path: 'serviceId',
                    select: '_id title description price category requiredDocuments customDropdowns applicationDetails additionalFields'
                })
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
                .populate({
                    path: 'serviceId',
                    select: '_id title description price category requiredDocuments customDropdowns applicationDetails additionalFields'
                })
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

    // Update order status (for both admin and users)
    updateOrderStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status, trackingStatus, action } = req.body;

            console.log('Updating order status:', {
                orderId,
                requestBody: req.body,
                userId: req.user.id,
                userRole: req.user.role
            });

            const order = await Review.findById(orderId);
            if (!order) {
                throw new NotFoundError('Order not found');
            }

            // Check if user has permission to update this order
            if (!req.user.role.includes('app_admin') && order.userId.toString() !== req.user.id) {
                throw new ValidationError('Not authorized to update this order');
            }

            let statusUpdate = {};

            if (action) {
                // Handle action-based updates
                switch (action) {
                    case 'start_processing':
                        statusUpdate = {
                            status: 'processing',
                            trackingStatus: 'Processing Started'
                        };
                        break;
                    case 'complete_order':
                        statusUpdate = {
                            status: 'completed',
                            trackingStatus: 'Completed Successfully'
                        };
                        break;
                    case 'cancel_order':
                        statusUpdate = {
                            status: 'cancelled',
                            trackingStatus: 'Cancelled'
                        };
                        break;
                    default:
                        throw new ValidationError('Invalid action');
                }
            } else {
                // Handle direct status updates
                statusUpdate = {
                    ...(status && { status }),
                    ...(trackingStatus && { trackingStatus })
                };

                // Validate status if provided
                if (status && !Review.schema.path('status').enumValues.includes(status)) {
                    throw new ValidationError(`Invalid status: ${status}`);
                }

                // Validate trackingStatus if provided
                if (trackingStatus && !Review.schema.path('trackingStatus').enumValues.includes(trackingStatus)) {
                    throw new ValidationError(`Invalid tracking status: ${trackingStatus}`);
                }
            }

            console.log('Applying status update:', statusUpdate);

            // Clear OCR data and additional fields for completed or cancelled orders
            if (statusUpdate.status === 'completed' || statusUpdate.status === 'cancelled') {
                if (order.documents && order.documents.length > 0) {
                    order.documents.forEach(doc => {
                        doc.ocrData = {};
                    });
                }
                order.additionalFields = [];
                await order.save();
            }

            const updatedOrder = await Review.findByIdAndUpdate(
                orderId,
                { 
                    $set: statusUpdate,
                    $push: { 
                        statusHistory: {
                            ...statusUpdate,
                            updatedBy: req.user.id,
                            updatedAt: new Date()
                        }
                    }
                },
                { new: true, runValidators: true }
            )
            .populate('serviceId')
            .populate('userId', '-password');

            console.log('Order updated successfully:', updatedOrder);

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