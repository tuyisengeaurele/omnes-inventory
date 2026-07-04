export type CategoryRow = {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
};

export type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  taxClass: string;
  tags: string[];
  category: { id: string; name: string } | null;
  isArchived: boolean;
  variantCount: number;
  primaryImage: string | null;
};

export type Variant = {
  id: string;
  name: string;
  sku: string;
  attributes: Record<string, string>;
  barcode: string | null;
  isDefault: boolean;
};

export type ProductImage = {
  id: string;
  fileName: string;
  position: number;
  isPrimary: boolean;
};

export type ProductDetail = {
  id: string;
  sku: string;
  name: string;
  description: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  taxClass: string;
  barcode: string | null;
  tags: string[];
  categoryId: string | null;
  category: { id: string; name: string } | null;
  isArchived: boolean;
  variants: Variant[];
  images: ProductImage[];
};
