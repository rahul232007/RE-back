const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// GET /api/projects  — Public
const getProjects = async (req, res) => {
  try {
    const {
      category,
      status,
      featured,
      page = 1,
      limit = 12,
      sort = '-createdAt',
      search,
    } = req.query;

    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'),
      Project.countDocuments(filter),
    ]);

    return res.status(200).json(
      successResponse('Projects retrieved', {
        projects,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      })
    );
  } catch (err) {
    console.error('Get projects error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// GET /api/projects/:slug  — Public
const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).select('-__v');

    if (!project) {
      return res.status(404).json(errorResponse('Project not found'));
    }

    return res.status(200).json(successResponse('Project retrieved', { project }));
  } catch (err) {
    console.error('Get project by slug error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// POST /api/projects  — Admin only
const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);

    return res
      .status(201)
      .json(successResponse('Project created successfully', { project }));
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(422).json({ success: false, message: 'Validation failed', errors });
    }
    if (err.code === 11000) {
      return res
        .status(409)
        .json(errorResponse('A project with this title already exists'));
    }
    console.error('Create project error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// PUT /api/projects/:id  — Admin only
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json(errorResponse('Project not found'));
    }

    return res.status(200).json(successResponse('Project updated successfully', { project }));
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(422).json({ success: false, message: 'Validation failed', errors });
    }
    console.error('Update project error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// DELETE /api/projects/:id  — Admin only
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json(errorResponse('Project not found'));
    }

    return res.status(200).json(successResponse('Project deleted successfully'));
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

module.exports = {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
};
