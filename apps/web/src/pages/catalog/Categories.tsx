import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { Button, ErrorNote, TextInput } from '../../components/forms';
import type { CategoryRow } from './types';

export default function Categories() {
  const { allowed } = useAuth();
  const canEdit = allowed('catalog:manage');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api<{ categories: CategoryRow[] }>('/categories').then((r) => setCategories(r.categories));

  useEffect(() => {
    load();
  }, []);

  // roots first, children under their parent
  const ordered = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    const byParent = new Map<string, CategoryRow[]>();
    for (const c of categories) {
      if (c.parentId) {
        byParent.set(c.parentId, [...(byParent.get(c.parentId) ?? []), c]);
      }
    }
    const out: { row: CategoryRow; depth: number }[] = [];
    const walk = (row: CategoryRow, depth: number) => {
      out.push({ row, depth });
      for (const child of byParent.get(row.id) ?? []) walk(child, depth + 1);
    };
    roots.forEach((r) => walk(r, 0));
    return out;
  }, [categories]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'that did not work');
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/app/products" className="text-xs text-bone/40 hover:text-bone">
        &larr; Products
      </Link>
      <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-tight">Categories</h1>

      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            run(() => api('/categories', { body: { name, parentId } })).then(() => setName(''));
          }}
          className="mt-6 flex items-center gap-2"
        >
          <div className="w-64">
            <TextInput
              placeholder={parentId ? 'New subcategory name' : 'New category name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {parentId && (
            <span className="text-xs text-bone/50">
              under {categories.find((c) => c.id === parentId)?.name}{' '}
              <button type="button" className="text-teal" onClick={() => setParentId(null)}>
                clear
              </button>
            </span>
          )}
          <Button type="submit">Add</Button>
        </form>
      )}
      <ErrorNote message={error} />

      <div className="rule mt-6 overflow-hidden rounded-lg border">
        {ordered.length === 0 && (
          <p className="p-6 text-center text-sm text-bone/40">No categories yet.</p>
        )}
        {ordered.map(({ row, depth }) => (
          <div
            key={row.id}
            className="flex items-center justify-between border-b border-bone/5 px-4 py-2.5 last:border-0"
            style={{ paddingLeft: `${16 + depth * 24}px` }}
          >
            {renaming?.id === row.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() =>
                    api(`/categories/${row.id}`, { method: 'PATCH', body: { name: renaming.name } }),
                  ).then(() => setRenaming(null));
                }}
                className="flex items-center gap-2"
              >
                <div className="w-56">
                  <TextInput
                    value={renaming.name}
                    onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <Button type="submit" kind="quiet">Save</Button>
              </form>
            ) : (
              <span className="text-sm text-bone/80">
                {row.name}
                <span className="ml-2 font-mono text-xs text-bone/30">{row.productCount}</span>
              </span>
            )}
            {canEdit && renaming?.id !== row.id && (
              <div className="flex items-center gap-3 text-xs">
                <button type="button" onClick={() => setParentId(row.id)} className="text-bone/40 hover:text-bone">
                  Add child
                </button>
                <button type="button" onClick={() => setRenaming({ id: row.id, name: row.name })} className="text-bone/40 hover:text-bone">
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => run(() => api(`/categories/${row.id}`, { method: 'DELETE' }))}
                  className="text-bone/40 hover:text-teal"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
