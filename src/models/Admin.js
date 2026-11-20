const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const mapAdmin = (row) => row && ({
  _id: String(row.id),
  id: String(row.id),
  email: row.email,
  name: row.name,
  role: row.role,
  lastLogin: row.last_login,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const count = async () => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admins');
  return rows[0].count;
};

const create = async ({ email, password, name = 'Administrator' }) => {
  const hashedPassword = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO admins (email, password, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role, last_login, created_at, updated_at`,
    [email.trim().toLowerCase(), hashedPassword, name]
  );
  return mapAdmin(rows[0]);
};

const findByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1 LIMIT 1', [email.trim().toLowerCase()]);
  if (!rows[0]) return null;
  return { ...mapAdmin(rows[0]), password: rows[0].password };
};

const findById = async (id) => {
  if (!/^\d+$/.test(String(id))) return null;
  const { rows } = await pool.query(
    'SELECT id, email, name, role, last_login, created_at, updated_at FROM admins WHERE id = $1',
    [id]
  );
  return mapAdmin(rows[0]);
};

const updateLastLogin = async (id) => {
  await pool.query('UPDATE admins SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [id]);
};

const comparePassword = (candidate, hashed) => bcrypt.compare(candidate, hashed);

module.exports = { count, create, findByEmail, findById, updateLastLogin, comparePassword };
