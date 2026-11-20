const { pool } = require('../config/db');

const mapContact = (row) => row && ({
  _id: String(row.id),
  id: String(row.id),
  name: row.name,
  email: row.email,
  phone: row.phone,
  company: row.company,
  service: row.service,
  budget: row.budget,
  subject: row.subject,
  message: row.message,
  status: row.status,
  ipAddress: row.ip_address,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const create = async (contact) => {
  const { rows } = await pool.query(
    `INSERT INTO contacts (name, email, phone, company, service, budget, subject, message, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [contact.name, contact.email, contact.phone || null, contact.company || null,
      contact.service || null, contact.budget || null, contact.subject || null,
      contact.message, contact.ipAddress || null]
  );
  return mapContact(rows[0]);
};

const findPage = async ({ status, limit, offset, sort }) => {
  const sortColumn = sort.includes('createdAt') ? 'created_at' : 'updated_at';
  const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
  const values = [];
  const where = status ? 'WHERE status = $1' : '';
  if (status) values.push(status);
  values.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT * FROM contacts ${where} ORDER BY ${sortColumn} ${direction}, id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows.map(mapContact);
};

const count = async (status) => {
  const { rows } = await pool.query(
    status ? 'SELECT COUNT(*)::int AS count FROM contacts WHERE status = $1' : 'SELECT COUNT(*)::int AS count FROM contacts',
    status ? [status] : []
  );
  return rows[0].count;
};

const updateStatus = async (id, status) => {
  if (!/^\d+$/.test(String(id))) return null;
  const { rows } = await pool.query(
    'UPDATE contacts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return mapContact(rows[0]);
};

const deleteById = async (id) => {
  if (!/^\d+$/.test(String(id))) return null;
  const { rows } = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);
  return mapContact(rows[0]);
};

module.exports = { create, findPage, count, updateStatus, deleteById };
