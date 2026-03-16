const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 10));
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
    limit: pageSize
  };
};

const paginatedResponse = (data, total, pagination) => {
  const { page, pageSize } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
};

const parseSort = (sortString, allowedFields = []) => {
  if (!sortString) return null;

  const [field, direction] = sortString.split(':');
  
  if (allowedFields.length > 0 && !allowedFields.includes(field)) {
    return null;
  }

  return [[field, direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']];
};

module.exports = {
  paginate,
  paginatedResponse,
  parseSort
};
