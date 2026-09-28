// Page-number pagination shared by every list endpoint. Request: ?page=1&limit=20.
// Response: the list under its usual key plus a `pagination` object, e.g.
//   { transactions: [...], pagination: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toPositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function parsePagination(query, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

function buildPagination({ page, limit }, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
}

/**
 * Runs one page of `Model.find(filter)` alongside the total count.
 * @returns {Promise<{ items: Array, pagination: object }>}
 */
async function paginateQuery(Model, filter, paging, { sort, select, lean = false } = {}) {
  let query = Model.find(filter).sort(sort).skip(paging.skip).limit(paging.limit);
  if (select) query = query.select(select);
  if (lean) query = query.lean();

  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return { items, pagination: buildPagination(paging, total) };
}

// Search input goes into a RegExp - escape it so a name like "a.b" (or
// someone probing the search box) can't inject regex syntax.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { parsePagination, buildPagination, paginateQuery, escapeRegex };
