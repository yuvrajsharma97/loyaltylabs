const crypto = require('crypto');

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// name-based prefix + random suffix so collisions are rare, but callers should
// still retry on a duplicate-key error against the unique index (the DB is
// the real source of truth for uniqueness, this just makes collisions unlikely).
function generateSlug(seedText) {
  const base = slugify(seedText || 'user').slice(0, 20) || 'user';
  const suffix = crypto.randomBytes(4).toString('hex');
  return `${base}-${suffix}`;
}

module.exports = { generateSlug, slugify };
