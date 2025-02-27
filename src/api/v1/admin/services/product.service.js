const Product = require('../model/product.model');
const { ApiError } = require('../../../../middleware/error/errorTypes');

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
                sort = '-createdAt',
                category,
                search,
                minPrice,
                maxPrice
            } = query;

            const filter = {};
            
            if (category) {
                filter.category = { $regex: category, $options: 'i' };
            }

            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = parseFloat(minPrice);
                if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
            }

            const products = await Product.find(filter)
                .sort(sort)
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .exec();

            const total = await Product.countDocuments(filter);

            return {
                products,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
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
            const product = await Product.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    // Delete Product
    async deleteProduct(id) {
        try {
            const product = await Product.findByIdAndDelete(id);
            if (!product) {
                throw new Error('Product not found');
            }
            return true;
        } catch (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }

    // Search products
    async searchProducts(searchTerm) {
        try {
            if (!searchTerm) {
                return [];
            }
            return await Product.find({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } }
                ]
            });
        } catch (error) {
            throw new Error(`Error searching products: ${error.message}`);
        }
    }

    // Search all products with advanced filters
    async searchAllProducts(query) {
        try {
            const {
                keyword = '',
                priceRange = '',
                sort = 'newest',
                page = 1,
                limit = 10
            } = query;

            const filter = {};
            
            if (keyword) {
                filter.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { category: { $regex: keyword, $options: 'i' } }
                ];
            }

            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                if (!isNaN(min) && !isNaN(max)) {
                    filter.price = { $gte: min, $lte: max };
                }
            }

            let sortOption = {};
            switch (sort) {
                case 'price_low':
                    sortOption = { price: 1 };
                    break;
                case 'price_high':
                    sortOption = { price: -1 };
                    break;
                case 'oldest':
                    sortOption = { createdAt: 1 };
                    break;
                case 'newest':
                default:
                    sortOption = { createdAt: -1 };
            }

            const products = await Product.find(filter)
                .sort(sortOption)
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit));

            const total = await Product.countDocuments(filter);

            return {
                products,
                pagination: {
                    total,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    hasMore: page < Math.ceil(total / parseInt(limit))
                }
            };
        } catch (error) {
            throw new Error(`Error searching products: ${error.message}`);
        }
    }

    // Search by category
    async searchByCategory(category, query) {
        try {
            const {
                keyword = '',
                priceRange = '',
                sort = 'newest',
                page = 1,
                limit = 10
            } = query;

            const filter = {
                category: { $regex: new RegExp(category, 'i') }
            };

            if (keyword) {
                filter.$and = [
                    { category: { $regex: new RegExp(category, 'i') } },
                    {
                        $or: [
                            { title: { $regex: keyword, $options: 'i' } },
                            { description: { $regex: keyword, $options: 'i' } }
                        ]
                    }
                ];
            }

            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                if (!isNaN(min) && !isNaN(max)) {
                    filter.price = { $gte: min, $lte: max };
                }
            }

            let sortOption = {};
            switch (sort) {
                case 'price_low':
                    sortOption = { price: 1 };
                    break;
                case 'price_high':
                    sortOption = { price: -1 };
                    break;
                case 'oldest':
                    sortOption = { createdAt: 1 };
                    break;
                case 'newest':
                default:
                    sortOption = { createdAt: -1 };
            }

            const products = await Product.find(filter)
                .sort(sortOption)
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit));

            const total = await Product.countDocuments(filter);

            return {
                products,
                pagination: {
                    total,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    hasMore: page < Math.ceil(total / parseInt(limit))
                }
            };
        } catch (error) {
            throw new Error(`Error searching products by category: ${error.message}`);
        }
    }

    // Bulk create products
    async bulkCreateProducts(productsData) {
        try {
            return await Product.insertMany(productsData, { ordered: false });
        } catch (error) {
            throw new Error(`Error bulk creating products: ${error.message}`);
        }
    }
}

module.exports = new ProductService();