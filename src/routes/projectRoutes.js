const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/projects  — Public
router.get('/', getProjects);

// GET /api/projects/:slug  — Public (must come before /:id routes)
router.get('/:slug', getProjectBySlug);

// POST /api/projects  — Admin only
router.post('/', protect, createProject);

// PUT /api/projects/:id  — Admin only
router.put('/:id', protect, updateProject);

// DELETE /api/projects/:id  — Admin only
router.delete('/:id', protect, deleteProject);

module.exports = router;
