const mongoose = require('mongoose');
const slugify = require('slugify');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Residential',
        'Commercial',
        'Industrial',
        'Infrastructure',
        'Interior',
        'Renovation',
        'Other',
      ],
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'upcoming'],
      default: 'ongoing',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    client: {
      type: String,
      trim: true,
      maxlength: [150, 'Client name cannot exceed 150 characters'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    area: {
      type: String,
      trim: true,
    },
    value: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    coverImage: {
      type: String,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from title
projectSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Indexes (slug already unique via schema option — no duplicate needed)
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ featured: 1, isPublished: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
