const Review = require('../models/review.model');
const Finalized = require('../models/finalized.model');
const Product = require('../../admin/model/product.model');
const { uploadToS3 } = require('../../../../config/aws');

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

            // Process and upload documents if present
            let uploadedDocs = [];
            if (documents && documents.length > 0) {
                uploadedDocs = await Promise.all(
                    documents.map(async (doc, index) => {
                        try {
                            // Find the corresponding file
                            const file = files?.find(f => f.fieldname === `documents[${index}][file]`);
                            let docData = {
                                documentName: doc.documentName,
                                ocrData: doc.ocrData || {}
                            };

                            if (file) {
                                // If using S3
                                if (uploadToS3) {
                                    const uploadResult = await uploadToS3(file);
                                    docData.s3Url = uploadResult.url;
                                    docData.s3Key = uploadResult.key;
                                }
                                // If using P2P (implement your P2P upload logic here)
                                // const p2pResult = await uploadToP2P(file);
                                // docData.p2pHash = p2pResult.hash;
                                // docData.p2pUrl = p2pResult.url;
                            }

                            return docData;
                        } catch (error) {
                            console.warn(`Warning: Failed to process document ${doc.documentName}: ${error.message}`);
                            return {
                                documentName: doc.documentName,
                                ocrData: doc.ocrData || {}
                            };
                        }
                    })
                );
            }

            console.log('Documents processed successfully:', uploadedDocs);
            
            // Ensure additionalFields is properly formatted
            const processedAdditionalFields = Array.isArray(additionalFields) 
                ? additionalFields.map(field => ({
                    fieldName: field.fieldName,
                    fieldValue: field.fieldValue,
                    fieldType: field.fieldType || 'text'
                }))
                : [];

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
                .populate('serviceId')
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

        // Create finalized order
        const finalizedOrder = new Finalized({
            userId: reviewOrder.userId,
            serviceId: reviewOrder.serviceId,
            documents: reviewOrder.documents,
            orderIdentifier,
            selectorField,
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
                        // If using S3
                        if (uploadToS3) {
                            const uploadResult = await uploadToS3({
                                buffer: doc.file.buffer,
                                mimetype: doc.file.mimetype,
                                originalname: doc.file.originalname
                            });
                            docData.s3Url = uploadResult.url;
                            docData.s3Key = uploadResult.key;
                        }
                        // If using P2P (implement your P2P upload logic here)
                        // const p2pResult = await uploadToP2P(doc.file);
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