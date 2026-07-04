import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import { api } from '../../lib/api';
import { Button, Label, Select, TextInput } from '../../components/forms';
import type { ProductDetail, Variant } from './types';

// renders Code128 labels for a product variant and prints just the sheet.
// the @media print rules in index.css hide everything else.

function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      width: 1.6,
      height: 44,
      fontSize: 11,
      margin: 6,
      background: 'transparent',
      lineColor: '#f6f5f4',
    });
  }, [value]);
  return <svg ref={ref} className="barcode-svg" />;
}

export default function Labels() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variantId, setVariantId] = useState('');
  const [count, setCount] = useState('12');

  useEffect(() => {
    if (!id) return;
    api<{ product: ProductDetail }>(`/products/${id}`).then((r) => {
      setProduct(r.product);
      setVariantId(r.product.variants[0]?.id ?? '');
    });
  }, [id]);

  const variant: Variant | undefined = product?.variants.find((v) => v.id === variantId);
  const value = variant ? (variant.barcode || variant.sku) : '';
  const labels = useMemo(() => Array.from({ length: Math.min(96, Math.max(1, Number(count) || 1)) }), [count]);

  return (
    <div>
      <div className="print:hidden">
        <Link to={`/app/products/${id}`} className="text-xs text-bone/40 hover:text-bone">
          &larr; {product?.name ?? 'Product'}
        </Link>
        <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-tight">Print labels</h1>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Label htmlFor="variant">Variant</Label>
            <Select id="variant" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {product?.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.sku})
                </option>
              ))}
            </Select>
          </div>
          <div className="w-28">
            <Label htmlFor="count">Labels</Label>
            <TextInput id="count" type="number" min="1" max="96" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <Button type="button" onClick={() => window.print()}>
            Print
          </Button>
        </div>
        <p className="mt-2 text-xs text-bone/40">
          Labels use the variant barcode when set, the SKU otherwise.
        </p>
      </div>

      {value && (
        <div id="label-sheet" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {labels.map((_, i) => (
            <div key={i} className="rule flex flex-col items-center rounded border p-3 text-center">
              <span className="mb-1 line-clamp-1 text-xs text-bone/80">{product?.name}</span>
              <span className="mb-1 font-mono text-[10px] text-bone/50">{variant?.name}</span>
              <BarcodeSvg value={value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
