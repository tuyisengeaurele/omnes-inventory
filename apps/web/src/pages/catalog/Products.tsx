import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiDownload, uploadUrl } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { Button, TextInput, Select } from '../../components/forms';
import type { CategoryRow, ProductListItem } from './types';

type ListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: ProductListItem[];
};

export default function Products() {
  const { allowed } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    api<{ categories: CategoryRow[] }>('/categories').then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), archived: String(archived) });
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      api<ListResponse>(`/products?${params}`).then(setData);
    }, 200);
    return () => clearTimeout(t);
  }, [search, categoryId, archived, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-bone/50">{data?.total ?? 0} in the catalog</p>
        </div>
        <div className="flex items-center gap-2">
          {allowed('catalog:read') && (
            <Button kind="quiet" type="button" onClick={() => apiDownload('/catalog/export.csv', 'products.csv')}>
              Export CSV
            </Button>
          )}
          {allowed('catalog:manage') && (
            <>
              <Button kind="quiet" type="button" onClick={() => navigate('/app/products/import')}>
                Import
              </Button>
              <Button type="button" onClick={() => navigate('/app/products/new')}>
                New product
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <TextInput
            placeholder="Search name, SKU or barcode"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `- ${c.name}` : c.name}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-bone/60">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => {
              setArchived(e.target.checked);
              setPage(1);
            }}
            className="accent-teal"
          />
          Archived
        </label>
        <Link to="/app/products/categories" className="ml-auto text-sm text-teal hover:underline">
          Manage categories
        </Link>
      </div>

      <div className="rule overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="rule border-b bg-raised/50">
              <th className="microlabel px-4 py-3 font-normal">Product</th>
              <th className="microlabel px-4 py-3 font-normal">Category</th>
              <th className="microlabel px-4 py-3 text-right font-normal">Cost</th>
              <th className="microlabel px-4 py-3 text-right font-normal">Price</th>
              <th className="microlabel px-4 py-3 text-right font-normal">Variants</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/app/products/${p.id}`)}
                className="cursor-pointer border-b border-bone/5 transition-colors last:border-0 hover:bg-raised/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.primaryImage ? (
                      <img
                        src={uploadUrl(p.primaryImage)}
                        alt=""
                        className="h-9 w-9 rounded object-cover"
                      />
                    ) : (
                      <div className="rule flex h-9 w-9 items-center justify-center rounded border font-mono text-[10px] text-bone/30">
                        {p.unit.slice(0, 3)}
                      </div>
                    )}
                    <div>
                      <div className="text-bone/90">{p.name}</div>
                      <div className="font-mono text-xs text-bone/40">{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-bone/60">{p.category?.name ?? '-'}</td>
                <td className="px-4 py-3 text-right font-mono text-xs text-bone/70">
                  {p.costPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-bone/90">
                  {p.sellPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-bone/60">
                  {p.variantCount}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-bone/40">
                  Nothing here yet. Add your first product or import a CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button kind="quiet" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="font-mono text-xs text-bone/50">
            {page} / {pages}
          </span>
          <Button kind="quiet" type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
