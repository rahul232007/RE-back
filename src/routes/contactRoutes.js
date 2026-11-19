const express = require('express');
const router = express.Router();
const {
  submitContact,
  getContacts,
  updateContactStatus,
  deleteContact,
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/contact  — Public (contact form submission)
router.post('/', submitContact);

// GET /api/contact  — Admin only
router.get('/', protect, getContacts);

// PATCH /api/contact/:id/status  — Admin only
router.patch('/:id/status', protect, updateContactStatus);

// DELETE /api/contact/:id  — Admin only
router.delete('/:id', protect, deleteContact);

module.exports = router;
