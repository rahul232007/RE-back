const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// POST /api/contact  — Public
const submitContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      service,
      budget,
      subject,
      message,
      projectDescription,
    } = req.body;

    const finalMessage = (message || projectDescription || '').trim();

    // Basic validation
    if (!name || !email || !finalMessage) {
      return res
        .status(400)
        .json(errorResponse('Full Name, Email, and Project Description are required'));
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      company: company?.trim(),
      service: service?.trim(),
      budget: budget?.trim(),
      subject: subject?.trim() || (service ? `Inquiry: ${service}` : 'Project Inquiry'),
      message: finalMessage,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
    });

    return res.status(201).json(
      successResponse("Thank you! Your project inquiry has been received. We'll be in touch soon.", { contact })
    );
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
    console.error('Contact submit error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// GET /api/contact  — Admin only
const getContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status && ['new', 'read', 'replied', 'closed'].includes(status)) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Contact.countDocuments(filter),
    ]);

    return res.status(200).json(
      successResponse('Contacts retrieved', {
        contacts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      })
    );
  } catch (err) {
    console.error('Get contacts error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// PATCH /api/contact/:id/status  — Admin only
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.status(400).json(errorResponse('Invalid status value'));
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json(errorResponse('Contact not found'));
    }

    return res.status(200).json(successResponse('Status updated', { contact }));
  } catch (err) {
    console.error('Update contact status error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

// DELETE /api/contact/:id  — Admin only
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json(errorResponse('Contact not found'));
    }

    return res.status(200).json(successResponse('Contact deleted successfully'));
  } catch (err) {
    console.error('Delete contact error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

module.exports = { submitContact, getContacts, updateContactStatus, deleteContact };
