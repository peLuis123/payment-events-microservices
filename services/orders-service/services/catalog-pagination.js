const { AppError } = require('../middlewares/error.middleware');

function catalogPagination(query) {
  const invalid = () => { throw new AppError('Invalid catalog pagination', 400, 'INVALID_PAGINATION'); };
  const integer = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return invalid();
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number > max) return invalid();
    return number;
  };
  const page = integer(query.page, 1, 1000000);
  const pageSize = integer(query.pageSize, 12, 48);
  const sort = query.sort ?? 'featured';
  if (!['featured', 'low', 'high', 'name'].includes(sort)) invalid();
  for (const key of ['q', 'category']) {
    if (query[key] !== undefined && (typeof query[key] !== 'string' || query[key].length > 200)) invalid();
  }
  return { page, pageSize, sort, q: (query.q || '').trim().toLocaleLowerCase('es'), category: query.category || '' };
}

function paginateCatalog(items, options, categories = []) {
  const { pageSize, sort, q, category } = options;
  const categoryId = categories.find(c => c.categoryId === category || c.slug === category)?.categoryId || category;
  const filtered = items.filter(p => (!category || p.categoryId === categoryId) &&
    `${p.name} ${p.description || ''}`.toLocaleLowerCase('es').includes(q));
  filtered.sort((a, b) => {
    const difference = sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price :
      sort === 'name' ? a.name.localeCompare(b.name, 'es') : String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    return difference || a.productId.localeCompare(b.productId);
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(options.page, totalPages);
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total, totalPages };
}
module.exports = { catalogPagination, paginateCatalog };
