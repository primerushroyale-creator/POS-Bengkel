'use client';

import React from 'react';
import { Product } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Plus, Package, Wrench, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  cartQty?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAdd,
  cartQty = 0,
}) => {
  const isJasa = product.category === 'jasa';
  const isOutOfStock = !isJasa && product.stock <= 0;
  const isLowStock = !isJasa && product.stock > 0 && product.stock <= product.min_stock;

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) onAdd(product);
      }}
      className={cn(
        'group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-150 select-none min-h-[140px]',
        isOutOfStock
          ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
          : 'border-slate-200/80 hover:border-indigo-400 hover:shadow-soft-md active:scale-[0.98] cursor-pointer shadow-soft-sm'
      )}
    >
      {/* Top Meta: Category & Stock Badge */}
      <div className="flex items-start justify-between gap-1.5 mb-2">
        <Badge variant={isJasa ? 'jasa' : 'barang'} size="sm">
          {isJasa ? (
            <Wrench className="w-3 h-3 text-purple-600" />
          ) : (
            <Package className="w-3 h-3 text-blue-600" />
          )}
          <span>{product.sub_category || (isJasa ? 'Jasa Servis' : 'Barang')}</span>
        </Badge>

        {isOutOfStock ? (
          <Badge variant="danger" size="sm">
            Habis
          </Badge>
        ) : isLowStock ? (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="w-3 h-3" />
            <span>Sisa {product.stock}</span>
          </Badge>
        ) : !isJasa ? (
          <span className="text-[11px] text-slate-400 font-medium">
            Stok: {product.stock}
          </span>
        ) : null}
      </div>

      {/* Product Code & Name */}
      <div className="my-auto">
        <p className="text-[11px] font-mono font-medium text-slate-400 mb-0.5">
          {product.code}
        </p>
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h4>
      </div>

      {/* Bottom: Price & Add Action */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
        <div>
          <span className="text-xs text-slate-400 block -mb-0.5">Harga</span>
          <span className="text-sm sm:text-base font-extrabold text-indigo-600">
            {formatRupiah(product.price)}
          </span>
        </div>

        <div className="relative">
          {cartQty > 0 ? (
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-soft transition-transform group-hover:scale-110">
              {cartQty}
            </div>
          ) : (
            <button
              disabled={isOutOfStock}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
