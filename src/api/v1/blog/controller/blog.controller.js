const BlogService = require('../services/blog.service');

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
      const post = await BlogService.createPost(req.body);
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updatePost(req, res) {
    try {
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
}

module.exports = new BlogController();