const slugify = require('slugify');
const { pool } = require('../config/db');

const publicColumns = `id, title, slug, description, short_description, category, status,
  location, client, start_date, end_date, area, value, images, cover_image, tags,
  featured, is_published, display_order, created_at, updated_at`;

const mapProject = (row) => row && ({
  _id: String(row.id),
  id: String(row.id),
  title: row.title,
  slug: row.slug,
  description: row.description,
  shortDescription: row.short_description,
  category: row.category,
  status: row.status,
  location: row.location,
  client: row.client,
  startDate: row.start_date,
  endDate: row.end_date,
  area: row.area,
  value: row.value,
  images: row.images || [],
  coverImage: row.cover_image,
  tags: row.tags || [],
  featured: row.featured,
  isPublished: row.is_published,
  order: row.display_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildPublicFilter = ({ category, status, featured, search }) => {
  const clauses = ['is_published = TRUE'];
  const values = [];
  const add = (clause, value) => {
    values.push(value);
    clauses.push(clause.replace('?', `$${values.length}`));
  };
  if (category) add('category = ?', category);
  if (status) add('status = ?', status);
  if (featured === true) add('featured = ?', true);
  if (search) {
    const pattern = `%${search}%`;
    values.push(pattern, pattern, pattern);
    clauses.push(`(title ILIKE $${values.length - 2} OR description ILIKE $${values.length - 1} OR tags::text ILIKE $${values.length})`);
  }
  return { where: clauses.join(' AND '), values };
};

const findPublic = async ({ category, status, featured, search, limit, offset, sort }) => {
  const { where, values } = buildPublicFilter({ category, status, featured, search });
  const sortColumns = { createdAt: 'created_at', updatedAt: 'updated_at', title: 'title', order: 'display_order' };
  const descending = sort.startsWith('-');
  const sortColumn = sortColumns[descending ? sort.slice(1) : sort] || 'created_at';
  const { rows } = await pool.query(
    `SELECT ${publicColumns} FROM projects WHERE ${where}
     ORDER BY ${sortColumn} ${descending ? 'DESC' : 'ASC'}, id DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );
  return rows.map(mapProject);
};

const countPublic = async (filters) => {
  const { where, values } = buildPublicFilter(filters);
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM projects WHERE ${where}`, values);
  return rows[0].count;
};

const findPublishedBySlug = async (slug) => {
  const { rows } = await pool.query(
    `SELECT ${publicColumns} FROM projects WHERE slug = $1 AND is_published = TRUE LIMIT 1`,
    [slug]
  );
  return mapProject(rows[0]);
};

const fieldMap = {
  title: 'title', description: 'description', shortDescription: 'short_description',
  category: 'category', status: 'status', location: 'location', client: 'client',
  startDate: 'start_date', endDate: 'end_date', area: 'area', value: 'value',
  images: 'images', coverImage: 'cover_image', tags: 'tags', featured: 'featured',
  isPublished: 'is_published', order: 'display_order',
};

const normalizeValue = (key, value) => {
  if (key === 'images') return JSON.stringify(Array.isArray(value) ? value : []);
  if (key === 'tags') return JSON.stringify(Array.isArray(value) ? value.map((tag) => String(tag).trim().toLowerCase()) : []);
  if (['startDate', 'endDate'].includes(key) && value === '') return null;
  if (typeof value === 'string' && !['description'].includes(key)) return value.trim();
  return value;
};

const create = async (project) => {
  const keys = Object.keys(fieldMap).filter((key) => project[key] !== undefined);
  const values = keys.map((key) => normalizeValue(key, project[key]));
  const slug = slugify(project.title, { lower: true, strict: true });
  const columns = keys.map((key) => fieldMap[key]);
  columns.push('slug');
  values.push(slug);
  const placeholders = values.map((_, index) => `$${index + 1}`);
  const { rows } = await pool.query(
    `INSERT INTO projects (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${publicColumns}`,
    values
  );
  return mapProject(rows[0]);
};

const updateById = async (id, project) => {
  if (!/^\d+$/.test(String(id))) return null;
  const keys = Object.keys(fieldMap).filter((key) => Object.hasOwn(project, key));
  const values = keys.map((key) => normalizeValue(key, project[key]));
  const assignments = keys.map((key, index) => `${fieldMap[key]} = $${index + 1}`);
  if (keys.includes('title')) {
    values.push(slugify(project.title, { lower: true, strict: true }));
    assignments.push(`slug = $${values.length}`);
  }
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE projects SET ${assignments.length ? `${assignments.join(', ')}, ` : ''}updated_at = NOW()
     WHERE id = $${values.length} RETURNING ${publicColumns}`,
    values
  );
  return mapProject(rows[0]);
};

const deleteById = async (id) => {
  if (!/^\d+$/.test(String(id))) return null;
  const { rows } = await pool.query(`DELETE FROM projects WHERE id = $1 RETURNING ${publicColumns}`, [id]);
  return mapProject(rows[0]);
};

const count = async () => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM projects');
  return rows[0].count;
};

module.exports = { findPublic, countPublic, findPublishedBySlug, create, updateById, deleteById, count, mapProject };
