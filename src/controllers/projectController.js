const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const categories = ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Interior', 'Renovation', 'Other'];
const statuses = ['ongoing', 'completed', 'upcoming'];

const validateProject = (project, partial = false) => {
  const errors = [];
  const has = (key) => Object.hasOwn(project, key);
  if (!partial || has('title')) {
    const title = String(project.title || '').trim();
    if (title.length < 3) errors.push('Title must be at least 3 characters');
    if (title.length > 150) errors.push('Title cannot exceed 150 characters');
  }
  if (!partial || has('description')) {
    const description = String(project.description || '').trim();
    if (description.length < 10) errors.push('Description must be at least 10 characters');
    if (description.length > 5000) errors.push('Description cannot exceed 5000 characters');
  }
  if (!partial || has('category')) {
    if (!categories.includes(project.category)) errors.push('Category is required and must be valid');
  }
  if (has('status') && !statuses.includes(project.status)) errors.push('Status must be ongoing, completed, or upcoming');
  if (has('shortDescription') && String(project.shortDescription || '').length > 300) errors.push('Short description cannot exceed 300 characters');
  if (has('location') && String(project.location || '').length > 200) errors.push('Location cannot exceed 200 characters');
  if (has('client') && String(project.client || '').length > 150) errors.push('Client name cannot exceed 150 characters');
  for (const key of ['startDate', 'endDate']) {
    if (has(key) && project[key] && Number.isNaN(Date.parse(project[key]))) errors.push(`${key} must be a valid date`);
  }
  if (has('images') && !Array.isArray(project.images)) errors.push('Images must be an array');
  if (has('tags') && !Array.isArray(project.tags)) errors.push('Tags must be an array');
  return errors;
};

const toPage = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

// GET /api/projects — Public
const getProjects = async (req, res) => {
  try {
    const page = toPage(req.query.page, 1);
    const limit = Math.min(toPage(req.query.limit, 12), 100);
    const filters = {
      category: req.query.category,
      status: req.query.status,
      featured: req.query.featured === 'true',
      search: req.query.search?.trim(),
    };
    const offset = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const [projects, total] = await Promise.all([
      Project.findPublic({ ...filters, limit, offset, sort }),
      Project.countPublic(filters),
    ]);
    return res.status(200).json(successResponse('Projects retrieved', {
      projects,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }));
  } catch (err) {
    console.error('Get projects error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// GET /api/projects/:slug — Public
const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findPublishedBySlug(req.params.slug);
    if (!project) return res.status(404).json(errorResponse('Project not found'));
    return res.status(200).json(successResponse('Project retrieved', { project }));
  } catch (err) {
    console.error('Get project by slug error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// POST /api/projects — Admin only
const createProject = async (req, res) => {
  try {
    const errors = validateProject(req.body);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const project = await Project.create(req.body);
    return res.status(201).json(successResponse('Project created successfully', { project }));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json(errorResponse('A project with this title already exists'));
    console.error('Create project error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// PUT /api/projects/:id — Admin only
const updateProject = async (req, res) => {
  try {
    const errors = validateProject(req.body, true);
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });
    const project = await Project.updateById(req.params.id, req.body);
    if (!project) return res.status(404).json(errorResponse('Project not found'));
    return res.status(200).json(successResponse('Project updated successfully', { project }));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json(errorResponse('A project with this title already exists'));
    console.error('Update project error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// DELETE /api/projects/:id — Admin only
const deleteProject = async (req, res) => {
  try {
    const project = await Project.deleteById(req.params.id);
    if (!project) return res.status(404).json(errorResponse('Project not found'));
    return res.status(200).json(successResponse('Project deleted successfully'));
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

module.exports = { getProjects, getProjectBySlug, createProject, updateProject, deleteProject };
