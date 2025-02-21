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
  author: {
    name: {
      type: String,
      required: true
    },
    employeeId: {
      type: String,
      required: true
    }
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

const PrivacyPolicySchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Privacy policy content is required']
  },
  version: {
    type: String,
    required: [true, 'Version number is required'],
    unique: true
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required']
  },
  isActive: {
    type: Boolean,
    default: false
  },
  changelog: {
    type: String,
    required: [true, 'Changelog is required']
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// Add pagination plugin
PostSchema.plugin(mongoosePaginate);
PageSchema.plugin(mongoosePaginate);
CategorySchema.plugin(mongoosePaginate);
TagSchema.plugin(mongoosePaginate);
PrivacyPolicySchema.plugin(mongoosePaginate);

// Add slug generation middleware
[PostSchema, PageSchema, CategorySchema, TagSchema].forEach(schema => {
  schema.pre('save', function(next) {
    if (this.isModified('title') || this.isModified('name')) {
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const baseSlug = this.title || this.name;
      this.slug = `${slugify(baseSlug, { lower: true })}-${timestamp}-${randomString}`;
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

// Middleware to ensure only one active version exists
PrivacyPolicySchema.pre('save', async function(next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

module.exports = {
  Post: mongoose.model('Post', PostSchema),
  Page: mongoose.model('Page', PageSchema),
  Category: mongoose.model('Category', CategorySchema),
  Tag: mongoose.model('Tag', TagSchema),
  PrivacyPolicy: mongoose.model('PrivacyPolicy', PrivacyPolicySchema)
};