const Review = require('../models/review.model');
const Finalized = require('../models/finalized.model');
const Product = require('../../admin/model/product.model');

class OrderService {
    // Validate service existence and required documents
    async validateServiceAndDocuments(serviceId, documents) {
        const service = await Product.findById(serviceId);
        console.log('Found service:', service);

        if (!service || !service.isActive) {
            throw new Error('Service not found or inactive');
        }

        return service;
    }

    // Create new order
    async createOrder(orderData) {
        try {
            console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
            const { userId, serviceId, documents, files, status, trackingStatus, chatStatus, approveStatus, additionalFields } = orderData;

            // Validate service
            const service = await this.validateServiceAndDocuments(serviceId, documents);

            // Process documents
            let uploadedDocs = [];
            if (documents && documents.length > 0) {
                uploadedDocs = documents.map(doc => ({
                    documentName: doc.documentName,
                    ocrData: doc.ocrData || {},
                    ...(files?.find(f => f.fieldname === `documents[${documents.indexOf(doc)}][file]`) 
                        ? {
                            // Add file-related fields if needed
                            // p2pHash: null,
                            // p2pUrl: null
                          }
                        : {})
                }));
            }

            console.log('Documents processed:', uploadedDocs);
            
            // Process additional fields
            let processedAdditionalFields = [];
            if (additionalFields && additionalFields.length > 0) {
                processedAdditionalFields = additionalFields.map(field => ({
                    fieldName: field.fieldName,
                    fieldValue: field.fieldValue,
                    fieldType: field.fieldType || 'text'
                }));
            }

            console.log('Additional fields processed:', processedAdditionalFields);

            // Create review order
            const reviewOrder = new Review({
                userId,
                serviceId,
                documents: uploadedDocs,
                status: (status || 'pending').trim(),
                trackingStatus: (trackingStatus || 'Order Placed').trim(),
                chatStatus: (chatStatus || 'Enabled').trim(),
                approveStatus: (approveStatus || 'Disabled').trim(),
                additionalFields: processedAdditionalFields
            });

            const savedOrder = await reviewOrder.save();
            return await Review.findById(savedOrder._id)
                .populate({
                    path: 'serviceId',
                    select: '_id title description price category requiredDocuments customDropdowns applicationDetails additionalFields'
                })
                .populate('userId', '-password');
        } catch (error) {
            console.error('Order creation error:', error);
            throw error;
        }
    }

    // Get order history with pagination and filters
    async getOrderHistory(userId, query) {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate
        } = query;

        // Build filter object
        const filter = { userId };
        
        if (status) {
            filter.trackingStatus = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Get review orders
        const reviewOrders = await Review.find(filter)
            .populate('serviceId', 'title description price category')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit);

        // Get finalized orders
        const finalizedOrders = await Finalized.find(filter)
            .populate('serviceId', 'title description price category')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total counts
        const totalReview = await Review.countDocuments(filter);
        const totalFinalized = await Finalized.countDocuments(filter);

        return {
            review: {
                orders: reviewOrders,
                total: totalReview,
                page: parseInt(page),
                totalPages: Math.ceil(totalReview / limit)
            },
            finalized: {
                orders: finalizedOrders,
                total: totalFinalized,
                page: parseInt(page),
                totalPages: Math.ceil(totalFinalized / limit)
            }
        };
    }

    // Approve and finalize order
    async approveOrder(orderId, approvalData) {
        const { orderIdentifier, selectorField } = approvalData;

        // Find and validate review order
        const reviewOrder = await Review.findById(orderId)
            .populate('serviceId', 'title description price category');

        if (!reviewOrder) {
            throw new Error('Order not found');
        }

        if (reviewOrder.trackingStatus === 'Rejected') {
            throw new Error('Cannot approve rejected order');
        }

        // Validate order identifier format if needed
        if (!this.validateOrderIdentifier(orderIdentifier)) {
            throw new Error('Invalid order identifier format');
        }

        // Clear OCR data before creating finalized order
        const documents = reviewOrder.documents.map(doc => ({
            documentName: doc.documentName,
            s3Url: doc.s3Url || '',
            ocrData: {} // Clear OCR data
        }));

        // Create finalized order with cleared data
        const finalizedOrder = new Finalized({
            userId: reviewOrder.userId,
            serviceId: reviewOrder.serviceId,
            documents: documents,
            orderIdentifier,
            selectorField,
            additionalFields: [], // Clear additional fields
            trackingStatus: 'Approved',
            approvedAt: new Date()
        });

        // Save finalized order and delete review order in a transaction
        const session = await Finalized.startSession();
        try {
            await session.withTransaction(async () => {
                await finalizedOrder.save({ session });
                await Review.findByIdAndDelete(orderId).session(session);
            });
        } finally {
            await session.endSession();
        }

        return await Finalized.findById(finalizedOrder._id)
            .populate('serviceId', 'title description price category')
            .populate('userId', 'name email');
    }

    // Update review order
    async updateReviewOrder(orderId, updateData) {
        // If there are new documents, process them
        if (updateData.documents) {
            const uploadedDocs = await Promise.all(
                updateData.documents.map(async (doc) => {
                    let docData = {
                        documentName: doc.documentName,
                        ocrData: doc.ocrData || {}
                    };

                    if (doc.file) {
                        // Handle P2P file upload
                        // Note: Implement your P2P upload logic here
                        // docData.p2pHash = p2pResult.hash;
                        // docData.p2pUrl = p2pResult.url;
                    }
                    return docData;
                })
            );
            updateData.documents = uploadedDocs;
        }

        const updatedOrder = await Review.findByIdAndUpdate(
            orderId,
            {
                ...updateData,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('serviceId', 'title description price category');

        if (!updatedOrder) {
            throw new Error('Order not found');
        }

        return updatedOrder;
    }
}

module.exports = new OrderService();