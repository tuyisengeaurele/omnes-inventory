import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiUpload, ApiError } from '../../lib/api';
import { Button, ErrorNote } from '../../components/forms';

type PreviewRow = {
  line: number;
  action: 'create' | 'update' | 'error';
  message?: string;
  data?: Record<string, string | number>;
};

type Preview = {
  rows: PreviewRow[];
  summary: { create: number; update: number; error: number };
};

const ACTION_STYLE: Record<PreviewRow['action'], string> = {
  create: 'text-green',
  update: 'text-blue',
  error: 'text-teal',
};

export default function ImportProducts() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ created: number; updated: number } | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const form = new FormData();
      form.append('file', files[0]);
      setPreview(await apiUpload<Preview>('/catalog/import/preview', form));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'could not read the file');
      setPreview(null);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const rows = preview.rows.filter((r) => r.action !== 'error').map((r) => r.data);
      const res = await api<{ created: number; updated: number }>('/catalog/import/commit', {
        body: { rows },
      });
      setDone(res);
      setPreview(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'import failed');
    } finally {
      setBusy(false);
    }
  }

  const importable = preview ? preview.summary.create + preview.summary.update : 0;

  return (
    <div className="max-w-4xl">
      <Link to="/app/products" className="text-xs text-bone/40 hover:text-bone">
        &larr; Products
      </Link>
      <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-tight">Import products</h1>
      <p className="mt-2 max-w-lg text-sm text-bone/50">
        Upload a CSV with the columns sku, name, description, unit, cost_price, sell_price,
        tax_class, barcode, category and tags (semicolon separated). Existing SKUs get updated,
        new ones get created. Nothing is written until you confirm the preview.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <Button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Working...' : 'Choose CSV file'}
        </Button>
        {preview && (
          <Button type="button" kind="quiet" disabled={busy || importable === 0} onClick={commit}>
            Import {importable} rows
          </Button>
        )}
      </div>
      <ErrorNote message={error} />

      {done && (
        <div className="rule mt-6 rounded-lg border p-5">
          <p className="text-sm text-bone/80">
            Done. {done.created} created, {done.updated} updated.
          </p>
          <button type="button" onClick={() => navigate('/app/products')} className="mt-2 text-sm text-teal hover:underline">
            Back to products
          </button>
        </div>
      )}

      {preview && (
        <div className="mt-6">
          <p className="mb-3 font-mono text-xs text-bone/50">
            {preview.summary.create} to create, {preview.summary.update} to update,{' '}
            {preview.summary.error} with problems
          </p>
          <div className="rule max-h-96 overflow-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-raised">
                <tr className="rule border-b">
                  <th className="microlabel px-3 py-2 font-normal">Line</th>
                  <th className="microlabel px-3 py-2 font-normal">Action</th>
                  <th className="microlabel px-3 py-2 font-normal">SKU</th>
                  <th className="microlabel px-3 py-2 font-normal">Name</th>
                  <th className="microlabel px-3 py-2 font-normal">Problem</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {preview.rows.map((r) => (
                  <tr key={r.line} className="border-b border-bone/5 last:border-0">
                    <td className="px-3 py-2 text-bone/40">{r.line}</td>
                    <td className={`px-3 py-2 uppercase ${ACTION_STYLE[r.action]}`}>{r.action}</td>
                    <td className="px-3 py-2 text-bone/70">{r.data?.sku ?? '-'}</td>
                    <td className="px-3 py-2 font-body text-sm text-bone/70">{r.data?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-bone/50">{r.message ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
