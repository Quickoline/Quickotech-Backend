const Product = require('../model/product.model');

class ProductService {
    // Create Product
    async createProduct(productData) {
        try {
            const product = new Product(productData);
            return await product.save();
        } catch (error) {
            throw new Error(`Error creating product: ${error.message}`);
        }
    }

    // Get all Products with filters, pagination and sorting
    async getAllProducts(query) {
        try {
            const {
                page = 1,
                limit = 10,
                sort = 'createdAt',
                category,
                search,
                minPrice,
                maxPrice
            } = query;

            // Build filter object
            const filter = {};
            
            if (category) {
                filter.category = category;
            }

            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = minPrice;
                if (maxPrice) filter.price.$lte = maxPrice;
            }

            // Execute query with pagination
            const products = await Product.find(filter)
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            // Get total documents
            const total = await Product.countDocuments(filter);

            return {
                products,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            };
        } catch (error) {
            throw new Error(`Error fetching products: ${error.message}`);
        }
    }

    // Get Product by ID
    async getProductById(id) {
        try {
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            throw new Error(`Error fetching product: ${error.message}`);
        }
    }

    // Update Product
    async updateProduct(id, updateData) {
        try {
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Product not found');
            }

            // Validate update data
            if (updateData.price) {
                // Add price validation logic if needed
                if (isNaN(updateData.price)) {
                    throw new Error('Invalid price format');
                }
            }

            // Update the product
            Object.assign(product, updateData);
            return await product.save();
        } catch (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    // Delete Product
    async deleteProduct(id) {
        try {
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Product not found');
            }
            await product.remove();
            return true;
        } catch (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }

    // Additional business logic methods
    async getProductsByCategory(category) {
        try {
            return await Product.find({ category });
        } catch (error) {
            throw new Error(`Error fetching products by category: ${error.message}`);
        }
    }

    async searchProducts(searchTerm) {
        try {
            return await Product.find({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
            });
        } catch (error) {
            throw new Error(`Error searching products: ${error.message}`);
        }
    }

    // Bulk operations
    async bulkCreateProducts(productsData) {
        try {
            return await Product.insertMany(productsData);
        } catch (error) {
            throw new Error(`Error bulk creating products: ${error.message}`);
        }
    }

    async bulkUpdateProducts(updates) {
        try {
            const bulkOps = updates.map(update => ({
                updateOne: {
                    filter: { _id: update.id },
                    update: { $set: update.data }
                }
            }));
            return await Product.bulkWrite(bulkOps);
        } catch (error) {
            throw new Error(`Error bulk updating products: ${error.message}`);
        }
    }
}

module.exports = new ProductService();