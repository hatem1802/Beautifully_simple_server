// page and limit are validated (and coerced) before they reach here.
const paginate = (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  return { page, limit, skip: (page - 1) * limit };
};

const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: total === 0 ? 0 : Math.ceil(total / limit),
});

export { paginate, pageMeta };
