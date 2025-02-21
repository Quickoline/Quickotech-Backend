const BlogService = require('../services/blog.service');
const { Category, Tag, PrivacyPolicy } = require('../model/blog.model');
const mongoose = require('mongoose');

class BlogController {
  // Posts
  async getAllPosts(req, res) {
    try {
      const posts = await BlogService.getAllPosts(req.query);
      res.json({ success: true, data: posts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPost(req, res) {
    try {
      const post = await BlogService.getPostById(req.params.id);
      res.json({ success: true, data: post });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async createPost(req, res) {
    try {
      // Process categories and tags
      let categoryIds = [];
      let tagIds = [];

      // Handle categories
      if (req.body.categories) {
        // Convert string to array if needed
        const categoriesArray = typeof req.body.categories === 'string' 
          ? JSON.parse(req.body.categories) 
          : req.body.categories;

        if (Array.isArray(categoriesArray)) {
          const categoryPromises = categoriesArray.map(async (categoryName) => {
            let category = await Category.findOne({ name: categoryName });
            if (!category) {
              category = await Category.create({ 
                name: categoryName,
                description: `Category for ${categoryName}`
              });
            }
            return category._id;
          });
          categoryIds = await Promise.all(categoryPromises);
        }
      }

      // Handle tags
      if (req.body.tags) {
        // Convert string to array if needed
        const tagsArray = typeof req.body.tags === 'string'
          ? JSON.parse(req.body.tags)
          : req.body.tags;

        if (Array.isArray(tagsArray)) {
          const tagPromises = tagsArray.map(async (tagName) => {
            let tag = await Tag.findOne({ name: tagName });
            if (!tag) {
              tag = await Tag.create({ 
                name: tagName,
                description: `Tag for ${tagName}`
              });
            }
            return tag._id;
          });
          tagIds = await Promise.all(tagPromises);
        }
      }

      // Handle meta data
      const meta = req.body.meta ? 
        (typeof req.body.meta === 'string' ? JSON.parse(req.body.meta) : req.body.meta) 
        : undefined;

      // Prepare post data
      const postData = {
        ...req.body,
        categories: categoryIds,
        tags: tagIds,
        meta,
        author: {
          name: req.user.name,
          employeeId: req.user.employeeId
        }
      };

      // Add featured image if uploaded
      if (req.file) {
        postData.featured_image = req.file;
      }

      const post = await BlogService.createPost(postData);
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(400).json({ 
        success: false, 
        error: `Error creating post: ${error.message}` 
      });
    }
  }

  async updatePost(req, res) {
    try {
      // Handle meta data
      if (req.body.meta && typeof req.body.meta === 'string') {
        req.body.meta = JSON.parse(req.body.meta);
      }

      // Handle categories and tags if present
      if (req.body.categories && typeof req.body.categories === 'string') {
        req.body.categories = JSON.parse(req.body.categories);
      }
      if (req.body.tags && typeof req.body.tags === 'string') {
        req.body.tags = JSON.parse(req.body.tags);
      }

      // Add featured image if uploaded
      if (req.file) {
        req.body.featured_image = req.file;
      }

      const post = await BlogService.updatePost(req.params.id, req.body);
      res.json({ success: true, data: post });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deletePost(req, res) {
    try {
      await BlogService.deletePost(req.params.id);
      res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async searchPosts(req, res) {
    try {
      const posts = await BlogService.searchPosts(req.query.q);
      res.json({ success: true, data: posts });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Categories
  async getAllCategories(req, res) {
    try {
      const categories = await BlogService.getAllCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCategory(req, res) {
    try {
      const category = await BlogService.getCategoryById(req.params.categoryId);
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async createCategory(req, res) {
    try {
      const category = await BlogService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateCategory(req, res) {
    try {
      const category = await BlogService.updateCategory(req.params.categoryId, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteCategory(req, res) {
    try {
      await BlogService.deleteCategory(req.params.categoryId);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Tags
  async getAllTags(req, res) {
    try {
      const tags = await BlogService.getAllTags();
      res.json({ success: true, data: tags });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getTag(req, res) {
    try {
      const tag = await BlogService.getTagById(req.params.tagId);
      res.json({ success: true, data: tag });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async createTag(req, res) {
    try {
      const tag = await BlogService.createTag(req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateTag(req, res) {
    try {
      const tag = await BlogService.updateTag(req.params.tagId, req.body);
      res.json({ success: true, data: tag });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteTag(req, res) {
    try {
      await BlogService.deleteTag(req.params.tagId);
      res.json({ success: true, message: 'Tag deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Pages
  async getAllPages(req, res) {
    try {
      const pages = await BlogService.getAllPages();
      res.json({ success: true, data: pages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPage(req, res) {
    try {
      const page = await BlogService.getPageById(req.params.pageId);
      res.json({ success: true, data: page });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async createPage(req, res) {
    try {
      const page = await BlogService.createPage(req.body);
      res.status(201).json({ success: true, data: page });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updatePage(req, res) {
    try {
      const page = await BlogService.updatePage(req.params.pageId, req.body);
      res.json({ success: true, data: page });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deletePage(req, res) {
    try {
      await BlogService.deletePage(req.params.pageId);
      res.json({ success: true, message: 'Page deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Privacy Policy Methods
  async getCurrentPrivacyPolicy(req, res) {
    try {
      const policy = await PrivacyPolicy.findOne({ isActive: true })
        .sort({ created_at: -1 });

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: 'No active privacy policy found'
        });
      }

      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllPrivacyPolicyVersions(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        sort: { created_at: -1 }
      };

      const policies = await PrivacyPolicy.paginate({}, options);

      res.json({
        success: true,
        data: policies.docs,
        pagination: {
          total: policies.totalDocs,
          page: policies.page,
          pages: policies.totalPages
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPrivacyPolicyVersion(req, res) {
    try {
      const policy = await PrivacyPolicy.findOne({
        version: req.params.version
      });

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: 'Privacy policy version not found'
        });
      }

      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createPrivacyPolicy(req, res) {
    try {
      // Validate version format (optional)
      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (!versionRegex.test(req.body.version)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid version format. Use semantic versioning (e.g., 1.0.0)'
        });
      }

      // Check if version already exists
      const existingPolicy = await PrivacyPolicy.findOne({
        version: req.body.version
      });

      if (existingPolicy) {
        return res.status(400).json({
          success: false,
          error: 'This version number already exists'
        });
      }

      // Set effective date to today if not provided
      if (!req.body.effectiveDate) {
        req.body.effectiveDate = new Date();
      }

      const policy = new PrivacyPolicy(req.body);
      await policy.save();

      res.status(201).json({
        success: true,
        data: policy
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updatePrivacyPolicy(req, res) {
    try {
      const policy = await PrivacyPolicy.findOne({
        version: req.params.version
      });

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: 'Privacy policy version not found'
        });
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        policy[key] = req.body[key];
      });

      await policy.save();

      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deletePrivacyPolicy(req, res) {
    try {
      const policy = await PrivacyPolicy.findOne({
        version: req.params.version
      });

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: 'Privacy policy version not found'
        });
      }

      // Prevent deletion of active version
      if (policy.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the active privacy policy version'
        });
      }

      // Use deleteOne instead of remove
      await PrivacyPolicy.deleteOne({ _id: policy._id });

      res.json({
        success: true,
        message: 'Privacy policy version deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BlogController();