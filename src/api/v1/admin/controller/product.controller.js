const ProductService = require('../services/product.service');
const Product = require('../model/product.model');
const { ApiError } = require('../../../../middleware/error/errorTypes');

class ProductController {
    // Create a new product
    async createProduct(req, res) {
        try {
            const product = await ProductService.createProduct(req.body);
            res.status(201).json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get all products with filtering and pagination
    async getAllProducts(req, res) {
        try {
            const result = await ProductService.getAllProducts(req.query);
            res.status(200).json({
                success: true,
                data: result.products,
                pagination: {
                    total: result.total,
                    currentPage: result.currentPage,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get single product
    async getProductById(req, res) {
        try {
            const product = await ProductService.getProductById(req.params.id);
            res.status(200).json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Update product
    async updateProduct(req, res) {
        try {
            const product = await ProductService.updateProduct(req.params.id, req.body);
            res.status(200).json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Delete product
    async deleteProduct(req, res) {
        try {
            await ProductService.deleteProduct(req.params.id);
            res.status(200).json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            res.status(error.message.includes('not found') ? 404 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Search products
    async searchProducts(req, res) {
        try {
            const products = await ProductService.searchProducts(req.query.q);
            res.status(200).json({
                success: true,
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Search all products with advanced filters
    async searchAllProducts(req, res) {
        try {
            const result = await ProductService.searchAllProducts(req.query);
            res.status(200).json({
                success: true,
                data: result.products,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Search by category
    async searchByCategory(req, res) {
        try {
            const result = await ProductService.searchByCategory(req.params.category, req.query);
            res.status(200).json({
                success: true,
                data: result.products,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Bulk create products
    async bulkCreateProducts(req, res) {
        try {
            const products = await ProductService.bulkCreateProducts(req.body);
            res.status(201).json({
                success: true,
                data: products
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ProductController();