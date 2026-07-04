import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiUpload, uploadUrl, ApiError } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { Button, ErrorNote, Label, Select, TextInput } from '../../components/forms';
import type { CategoryRow, ProductDetail, Variant } from './types';

const TAX_CLASSES = ['standard', 'reduced', 'zero'];

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { allowed } = useAuth();
  const canEdit = allowed('catalog:manage');

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'unit',
    costPrice: '0',
    sellPrice: '0',
    taxClass: 'standard',
    barcode: '',
    categoryId: '',
    tags: '',
  });

  useEffect(() => {
    api<{ categories: CategoryRow[] }>('/categories').then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    if (!id) return;
    api<{ product: ProductDetail }>(`/products/${id}`).then((r) => {
      setProduct(r.product);
      setForm({
        sku: r.product.sku,
        name: r.product.name,
        description: r.product.description,
        unit: r.product.unit,
        costPrice: String(r.product.costPrice),
        sellPrice: String(r.product.sellPrice),
        taxClass: r.product.taxClass,
        barcode: r.product.barcode ?? '',
        categoryId: r.product.categoryId ?? '',
        tags: r.product.tags.join(', '),
      });
    });
  }, [id]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function payload() {
    return {
      sku: form.sku,
      name: form.name,
      description: form.description,
      unit: form.unit,
      costPrice: Number(form.costPrice) || 0,
      sellPrice: Number(form.sellPrice) || 0,
      taxClass: form.taxClass,
      barcode: form.barcode || null,
      categoryId: form.categoryId || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const res = await api<{ product: ProductDetail }>('/products', { body: payload() });
        navigate(`/app/products/${res.product.id}`, { replace: true });
      } else {
        const res = await api<{ product: ProductDetail }>(`/products/${id}`, {
          method: 'PATCH',
          body: payload(),
        });
        setProduct(res.product);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'could not save');
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive() {
    if (!product) return;
    await api(`/products/${product.id}/${product.isArchived ? 'unarchive' : 'archive'}`, { body: {} });
    const res = await api<{ product: ProductDetail }>(`/products/${product.id}`);
    setProduct(res.product);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/app/products" className="text-xs text-bone/40 hover:text-bone">
            &larr; Products
          </Link>
          <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-tight">
            {isNew ? 'New product' : product?.name ?? '...'}
          </h1>
          {product?.isArchived && (
            <span className="mt-1 inline-block rounded border border-teal/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-teal">
              Archived
            </span>
          )}
        </div>
        {!isNew && product && (
          <div className="flex items-center gap-2">
            <Link
              to={`/app/products/${product.id}/labels`}
              className="rule rounded border px-4 py-2 text-sm text-bone/70 hover:border-bone/30 hover:text-bone"
            >
              Print labels
            </Link>
            {canEdit && (
              <Button kind="quiet" type="button" onClick={toggleArchive}>
                {product.isArchived ? 'Restore' : 'Archive'}
              </Button>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <TextInput id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <TextInput id="sku" value={form.sku} onChange={(e) => set('sku', e.target.value)} required disabled={!canEdit} />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            disabled={!canEdit}
            className="rule w-full rounded border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-teal/50"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="unit">Unit</Label>
            <TextInput id="unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="cost">Cost price</Label>
            <TextInput id="cost" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="sell">Sell price</Label>
            <TextInput id="sell" type="number" step="0.01" min="0" value={form.sellPrice} onChange={(e) => set('sellPrice', e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="tax">Tax class</Label>
            <Select id="tax" value={form.taxClass} onChange={(e) => set('taxClass', e.target.value)} disabled={!canEdit}>
              {TAX_CLASSES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} disabled={!canEdit}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `- ${c.name}` : c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <TextInput id="barcode" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="tags">Tags, comma separated</Label>
            <TextInput id="tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} disabled={!canEdit} />
          </div>
        </div>

        <ErrorNote message={error} />
        {canEdit && (
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create product' : 'Save changes'}
          </Button>
        )}
      </form>

      {!isNew && product && (
        <>
          <VariantsSection product={product} canEdit={canEdit} onChange={() =>
            api<{ product: ProductDetail }>(`/products/${product.id}`).then((r) => setProduct(r.product))
          } />
          <ImagesSection product={product} canEdit={canEdit} onChange={() =>
            api<{ product: ProductDetail }>(`/products/${product.id}`).then((r) => setProduct(r.product))
          } />
        </>
      )}
    </div>
  );
}

function VariantsSection({
  product,
  canEdit,
  onChange,
}: {
  product: ProductDetail;
  canEdit: boolean;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', sku: '', attributes: '' });
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    try {
      const attributes: Record<string, string> = {};
      for (const pair of draft.attributes.split(',').map((s) => s.trim()).filter(Boolean)) {
        const [k, v] = pair.split(':').map((s) => s.trim());
        if (k && v) attributes[k] = v;
      }
      await api(`/products/${product.id}/variants`, {
        body: { name: draft.name, sku: draft.sku, attributes },
      });
      setDraft({ name: '', sku: '', attributes: '' });
      setAdding(false);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'could not add variant');
    }
  }

  async function remove(v: Variant) {
    try {
      await api(`/products/${product.id}/variants/${v.id}`, { method: 'DELETE' });
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'could not delete variant');
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="microlabel">Variants</h2>
        {canEdit && (
          <Button kind="quiet" type="button" onClick={() => setAdding(!adding)}>
            {adding ? 'Cancel' : 'Add variant'}
          </Button>
        )}
      </div>
      <div className="rule overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="rule border-b bg-raised/50">
              <th className="microlabel px-4 py-2.5 font-normal">Name</th>
              <th className="microlabel px-4 py-2.5 font-normal">SKU</th>
              <th className="microlabel px-4 py-2.5 font-normal">Attributes</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <tr key={v.id} className="border-b border-bone/5 last:border-0">
                <td className="px-4 py-2.5 text-bone/80">
                  {v.name}
                  {v.isDefault && <span className="ml-2 font-mono text-[10px] text-bone/30">DEFAULT</span>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-bone/60">{v.sku}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-bone/40">
                  {Object.entries(v.attributes ?? {}).map(([k, val]) => `${k}: ${val}`).join(', ') || '-'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {canEdit && !v.isDefault && (
                    <button type="button" onClick={() => remove(v)} className="text-xs text-bone/40 hover:text-teal">
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {adding && (
          <div className="rule grid gap-3 border-t bg-raised/30 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <TextInput placeholder="Name, e.g. Size L" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextInput placeholder="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
            <TextInput placeholder="size: L, color: red" value={draft.attributes} onChange={(e) => setDraft({ ...draft, attributes: e.target.value })} />
            <Button type="button" onClick={add} disabled={!draft.name || !draft.sku}>
              Add
            </Button>
          </div>
        )}
      </div>
      <ErrorNote message={error} />
    </section>
  );
}

function ImagesSection({
  product,
  canEdit,
  onChange,
}: {
  product: ProductDetail;
  canEdit: boolean;
  onChange: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      for (const file of files) form.append('images', file);
      await apiUpload(`/products/${product.id}/images`, form);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function move(imageId: string, dir: -1 | 1) {
    const order = [...product.images].sort((a, b) => a.position - b.position).map((i) => i.id);
    const idx = order.indexOf(imageId);
    const swap = idx + dir;
    if (swap < 0 || swap >= order.length) return;
    [order[idx], order[swap]] = [order[swap], order[idx]];
    await api(`/products/${product.id}/images/order`, { method: 'PATCH', body: { order } });
    onChange();
  }

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="microlabel">Images</h2>
        {canEdit && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />
            <Button kind="quiet" type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? 'Uploading...' : 'Upload images'}
            </Button>
          </>
        )}
      </div>
      {product.images.length === 0 ? (
        <p className="rule rounded-lg border border-dashed p-6 text-center text-sm text-bone/40">
          No images yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {[...product.images]
            .sort((a, b) => a.position - b.position)
            .map((img) => (
              <div key={img.id} className="rule group relative w-32 overflow-hidden rounded-lg border">
                <img src={uploadUrl(img.fileName)} alt="" className="h-32 w-32 object-cover" />
                {img.isPrimary && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-green">
                    Primary
                  </span>
                )}
                {canEdit && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/85 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => move(img.id, -1)} className="text-xs text-bone/60 hover:text-bone">&larr;</button>
                      <button type="button" onClick={() => move(img.id, 1)} className="text-xs text-bone/60 hover:text-bone">&rarr;</button>
                    </div>
                    <div className="flex gap-2">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => api(`/products/${product.id}/images/${img.id}/primary`, { body: {} }).then(onChange)}
                          className="text-[10px] uppercase text-bone/60 hover:text-green"
                        >
                          Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => api(`/products/${product.id}/images/${img.id}`, { method: 'DELETE' }).then(onChange)}
                        className="text-[10px] uppercase text-bone/60 hover:text-teal"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      <ErrorNote message={error} />
    </section>
  );
}
