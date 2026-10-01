const { catalogPagination, paginateCatalog } = require('../services/catalog-pagination');
const { createCatalogController } = require('../controllers/catalog.controller');
const products = Array.from({ length: 25 }, (_, i) => ({ productId: String(i).padStart(2, '0'), name: `Pieza ${i}`, price: i * 100, categoryId: i % 2 ? 'ceramic-id' : 'other', status: 'active' }));
test('pages are stable and disjoint, including the final partial page', () => {
  const options = catalogPagination({ page: '2', pageSize: '12', sort: 'low' });
  expect(paginateCatalog(products, options)).toMatchObject({ page: 2, total: 25, totalPages: 3, items: products.slice(12,24) });
  expect(paginateCatalog(products, { ...options, page: 3 }).items).toEqual(products.slice(24));
});
test('filters and sorts globally before slicing, resolving category slugs', () => {
  const options = catalogPagination({ page: '1', pageSize: '2', sort: 'high', category: 'ceramica', q: 'pieza' });
  expect(paginateCatalog(products, options, [{ categoryId: 'ceramic-id', slug: 'ceramica' }])).toMatchObject({ total: 12, items: [products[23], products[21]] });
});
test.each([{ page: '0' }, { page: '-1' }, { pageSize: '49' }, { page: '1.5' }, { q: ['a'] }, { sort: 'bad' }])('invalid query is rejected %j', query => {
  expect(() => catalogPagination(query)).toThrow();
});
test('empty results and out-of-range pages are normalized', () => {
  expect(paginateCatalog([], catalogPagination({ page: '99' }))).toMatchObject({ items: [], page: 1, total: 0, totalPages: 1 });
});
test('public pages exclude inactive products; legacy arrays remain supported', async () => {
  const controller = createCatalogController({ catalogRepository: { listProducts: async () => [...products, { ...products[0], productId: 'hidden', status: 'inactive' }] } });
  const res = { json: jest.fn() }; const next = jest.fn();
  await controller.listProducts({ merchantId: 'store', query: { page: '1' } }, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(res.json.mock.calls[0][0]).toMatchObject({ total: 25 });
  await controller.listProducts({ merchantId: 'store', query: {} }, res, next);
  expect(res.json.mock.calls[1][0]).toEqual(products);
});
