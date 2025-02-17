const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosePaginate = require('mongoose-paginate-v2');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  featured_image: String,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  published: {
    type: Boolean,
    default: false
  },
  meta: {
    description: String,
    keywords: [String]
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const PageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  content: String,
  featured_image: String,
  published: {
    type: Boolean,
    default: false
  },
  meta: {
    description: String,
    keywords: [String]
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: String
}, { timestamps: { createdAt: 'created_at' } });

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: String
}, { timestamps: { createdAt: 'created_at' } });

// Add pagination plugin
PostSchema.plugin(mongoosePaginate);
PageSchema.plugin(mongoosePaginate);
CategorySchema.plugin(mongoosePaginate);
TagSchema.plugin(mongoosePaginate);

// Add slug generation middleware
[PostSchema, PageSchema, CategorySchema, TagSchema].forEach(schema => {
  schema.pre('save', function(next) {
    if (this.isModified('title') || this.isModified('name')) {
      this.slug = slugify(this.title || this.name, { lower: true });
    }
    next();
  });
});

// Add population options for Post model
PostSchema.pre('find', function() {
  this.populate('categories tags');
});

PostSchema.pre('findOne', function() {
  this.populate('categories tags');
});

// Add virtual for formatted date
PostSchema.virtual('formattedDate').get(function() {
  return new Date(this.created_at).toLocaleDateString();
});

module.exports = {
  Post: mongoose.model('Post', PostSchema),
  Page: mongoose.model('Page', PageSchema),
  Category: mongoose.model('Category', CategorySchema),
  Tag: mongoose.model('Tag', TagSchema)
};