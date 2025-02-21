const { Post, Page, Category, Tag } = require('../model/blog.model');
const slugify = require('slugify');

class BlogService {
    // Post Services
    async getAllPosts(query = {}) {
        try {
            const options = {
                page: parseInt(query.page, 10) || 1,
                limit: parseInt(query.limit, 10) || 10,
                sort: { created_at: -1 },
                populate: ['categories', 'tags']
            };

            const posts = await Post.paginate(
                { published: true, ...query.filters },
                options
            );

            return posts;
        } catch (error) {
            throw new Error(`Error fetching posts: ${error.message}`);
        }
    }

    async getPostById(postId) {
        try {
            const post = await Post.findById(postId)
                .populate('categories')
                .populate('tags');
            
            if (!post) {
                throw new Error('Post not found');
            }

            return post;
        } catch (error) {
            throw new Error(`Error fetching post: ${error.message}`);
        }
    }

    async createPost(postData) {
        try {
            // Handle featured image if present
            if (postData.featured_image) {
                // Store the image hash/URL from P2P network
                postData.featured_image = postData.featured_image.hash || postData.featured_image.url;
            }

            // Validate categories and tags
            if (postData.categories) {
                const validCategories = await Category.find({
                    _id: { $in: postData.categories }
                });
                if (validCategories.length !== postData.categories.length) {
                    throw new Error('Invalid category IDs provided');
                }
            }

            if (postData.tags) {
                const validTags = await Tag.find({
                    _id: { $in: postData.tags }
                });
                if (validTags.length !== postData.tags.length) {
                    throw new Error('Invalid tag IDs provided');
                }
            }

            const post = new Post(postData);
            await post.save();
            return post;
        } catch (error) {
            throw new Error(`Error creating post: ${error.message}`);
        }
    }

    async updatePost(postId, updateData) {
        try {
            // Handle featured image if present
            if (updateData.featured_image) {
                // Store the image hash/URL from P2P network
                updateData.featured_image = updateData.featured_image.hash || updateData.featured_image.url;
            }

            // If title is being updated, generate a new slug
            if (updateData.title) {
                const timestamp = new Date().getTime();
                const randomString = Math.random().toString(36).substring(2, 8);
                updateData.slug = `${slugify(updateData.title, { lower: true })}-${timestamp}-${randomString}`;
            }

            const post = await Post.findByIdAndUpdate(
                postId,
                updateData,
                { 
                    new: true, 
                    runValidators: true 
                }
            ).populate(['categories', 'tags']);

            if (!post) {
                throw new Error('Post not found');
            }

            return post;
        } catch (error) {
            throw new Error(`Error updating post: ${error.message}`);
        }
    }

    async deletePost(postId) {
        try {
            const post = await Post.findByIdAndDelete(postId);
            if (!post) {
                throw new Error('Post not found');
            }
            return true;
        } catch (error) {
            throw new Error(`Error deleting post: ${error.message}`);
        }
    }

    async searchPosts(searchQuery) {
        try {
            const query = {
                published: true,
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { content: { $regex: searchQuery, $options: 'i' } }
                ]
            };

            const posts = await Post.find(query)
                .populate(['categories', 'tags'])
                .sort('-created_at');

            return posts;
        } catch (error) {
            throw new Error(`Error searching posts: ${error.message}`);
        }
    }

    // Category Services
    async getAllCategories() {
        try {
            const categories = await Category.find().sort('name');
            return categories;
        } catch (error) {
            throw new Error(`Error fetching categories: ${error.message}`);
        }
    }

    async createCategory(categoryData) {
        try {
            const category = new Category(categoryData);
            await category.save();
            return category;
        } catch (error) {
            throw new Error(`Error creating category: ${error.message}`);
        }
    }

    async updateCategory(categoryId, updateData) {
        try {
            const category = await Category.findByIdAndUpdate(
                categoryId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!category) {
                throw new Error('Category not found');
            }

            return category;
        } catch (error) {
            throw new Error(`Error updating category: ${error.message}`);
        }
    }

    async deleteCategory(categoryId) {
        try {
            // Check if category is being used
            const postsUsingCategory = await Post.countDocuments({
                categories: categoryId
            });

            if (postsUsingCategory > 0) {
                throw new Error('Category is in use and cannot be deleted');
            }

            const category = await Category.findByIdAndDelete(categoryId);
            if (!category) {
                throw new Error('Category not found');
            }

            return true;
        } catch (error) {
            throw new Error(`Error deleting category: ${error.message}`);
        }
    }

    // Tag Services
    async getAllTags() {
        try {
            const tags = await Tag.find().sort('name');
            return tags;
        } catch (error) {
            throw new Error(`Error fetching tags: ${error.message}`);
        }
    }

    async createTag(tagData) {
        try {
            const tag = new Tag(tagData);
            await tag.save();
            return tag;
        } catch (error) {
            throw new Error(`Error creating tag: ${error.message}`);
        }
    }

    async updateTag(tagId, updateData) {
        try {
            const tag = await Tag.findByIdAndUpdate(
                tagId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!tag) {
                throw new Error('Tag not found');
            }

            return tag;
        } catch (error) {
            throw new Error(`Error updating tag: ${error.message}`);
        }
    }

    async deleteTag(tagId) {
        try {
            // Check if tag is being used
            const postsUsingTag = await Post.countDocuments({
                tags: tagId
            });

            if (postsUsingTag > 0) {
                throw new Error('Tag is in use and cannot be deleted');
            }

            const tag = await Tag.findByIdAndDelete(tagId);
            if (!tag) {
                throw new Error('Tag not found');
            }

            return true;
        } catch (error) {
            throw new Error(`Error deleting tag: ${error.message}`);
        }
    }

    async getTagById(tagId) {
        try {
            const tag = await Tag.findById(tagId);
            if (!tag) {
                throw new Error('Tag not found');
            }
            return tag;
        } catch (error) {
            throw new Error(`Error fetching tag: ${error.message}`);
        }
    }

    // Page Services
    async getAllPages() {
        try {
            const pages = await Page.find().sort('title');
            return pages;
        } catch (error) {
            throw new Error(`Error fetching pages: ${error.message}`);
        }
    }

    async getPageById(pageId) {
        try {
            const page = await Page.findById(pageId);
            if (!page) {
                throw new Error('Page not found');
            }
            return page;
        } catch (error) {
            throw new Error(`Error fetching page: ${error.message}`);
        }
    }

    async createPage(pageData) {
        try {
            if (pageData.featured_image) {
                // Store the image hash/URL from P2P network
                pageData.featured_image = pageData.featured_image.hash || pageData.featured_image.url;
            }

            const page = new Page(pageData);
            await page.save();
            return page;
        } catch (error) {
            throw new Error(`Error creating page: ${error.message}`);
        }
    }

    async updatePage(pageId, updateData) {
        try {
            if (updateData.featured_image) {
                // Store the image hash/URL from P2P network
                updateData.featured_image = updateData.featured_image.hash || updateData.featured_image.url;
            }

            const page = await Page.findByIdAndUpdate(
                pageId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!page) {
                throw new Error('Page not found');
            }

            return page;
        } catch (error) {
            throw new Error(`Error updating page: ${error.message}`);
        }
    }

    async deletePage(pageId) {
        try {
            const page = await Page.findByIdAndDelete(pageId);
            if (!page) {
                throw new Error('Page not found');
            }
            return true;
        } catch (error) {
            throw new Error(`Error deleting page: ${error.message}`);
        }
    }
}

module.exports = new BlogService();