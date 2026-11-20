const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const parsePage = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

const submitContact = async (req, res) => {
  try {
    const {
      name, email, phone, company, service, budget, subject, message, projectDescription,
    } = req.body;
    const finalMessage = String(message || projectDescription || '').trim();
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanName || !cleanEmail || !finalMessage) {
      return res.status(400).json(errorResponse('Full Name, Email, and Project Description are required'));
    }
    const errors = [];
    if (cleanName.length < 2) errors.push('Name must be at least 2 characters');
    if (cleanName.length > 100) errors.push('Name cannot exceed 100 characters');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) errors.push('Please provide a valid email');
    if (finalMessage.length < 10) errors.push('Message must be at least 10 characters');
    if (finalMessage.length > 2000) errors.push('Message cannot exceed 2000 characters');
    if (String(company || '').length > 150) errors.push('Company name cannot exceed 150 characters');
    if (String(service || '').length > 150) errors.push('Service cannot exceed 150 characters');
    if (String(budget || '').length > 100) errors.push('Budget cannot exceed 100 characters');
    if (String(subject || '').length > 200) errors.push('Subject cannot exceed 200 characters');
    if (errors.length) return res.status(422).json({ success: false, message: 'Validation failed', errors });

    const contact = await Contact.create({
      name: cleanName,
      email: cleanEmail,
      phone: phone?.trim(),
      company: company?.trim(),
      service: service?.trim(),
      budget: budget?.trim(),
      subject: subject?.trim() || (service ? `Inquiry: ${service}` : 'Project Inquiry'),
      message: finalMessage,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
    });
    return res.status(201).json(successResponse(
      "Thank you! Your project inquiry has been received. We'll be in touch soon.",
      { contact }
    ));
  } catch (err) {
    console.error('Contact submit error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

const getContacts = async (req, res) => {
  try {
    const status = ['new', 'read', 'replied', 'closed'].includes(req.query.status) ? req.query.status : null;
    const page = parsePage(req.query.page, 1);
    const limit = Math.min(parsePage(req.query.limit, 20), 100);
    const sort = req.query.sort || '-createdAt';
    const offset = (page - 1) * limit;
    const [contacts, total] = await Promise.all([
      Contact.findPage({ status, limit, offset, sort }),
      Contact.count(status),
    ]);
    return res.status(200).json(successResponse('Contacts retrieved', {
      contacts,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }));
  } catch (err) {
    console.error('Get contacts error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.status(400).json(errorResponse('Invalid status value'));
    }
    const contact = await Contact.updateStatus(req.params.id, status);
    if (!contact) return res.status(404).json(errorResponse('Contact not found'));
    return res.status(200).json(successResponse('Status updated', { contact }));
  } catch (err) {
    console.error('Update contact status error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.deleteById(req.params.id);
    if (!contact) return res.status(404).json(errorResponse('Contact not found'));
    return res.status(200).json(successResponse('Contact deleted successfully'));
  } catch (err) {
    console.error('Delete contact error:', err);
    return res.status(500).json(errorResponse('Server error'));
  }
};

module.exports = { submitContact, getContacts, updateContactStatus, deleteContact };
