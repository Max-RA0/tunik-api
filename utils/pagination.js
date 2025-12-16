// server/utils/pagination.js
export const shouldPaginate = (req) =>
  Object.prototype.hasOwnProperty.call(req.query, "page") ||
  Object.prototype.hasOwnProperty.call(req.query, "limit") ||
  Object.prototype.hasOwnProperty.call(req.query, "q");

export const getPageLimit = (req, maxLimit = 7, defaultLimit = 7) => {
  let page = parseInt(req.query.page ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = parseInt(req.query.limit ?? String(defaultLimit), 10);
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;

  // 👇 máximo 7 siempre
  limit = Math.min(limit, maxLimit);

  const offset = (page - 1) * limit;

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  return { page, limit, offset, q };
};

export const buildPagination = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / limit));
  return {
    page,
    limit,
    total: Number(total) || 0,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
};
