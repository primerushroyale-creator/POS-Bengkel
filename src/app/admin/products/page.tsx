'use client';

import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { formatRupiah, parseRupiah } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToastStore } from '@/stores/useToastStore';
import { useDataStore } from '@/stores/useDataStore';
import {
  Package,
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductsManagementPage() {
  const { success, error } = useToastStore();
  const { products } = useDataStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('barang');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formCostPrice, setFormCostPrice] = useState<string>('');
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(3);
  const [formUnit, setFormUnit] = useState('Pcs');

  // Trigger re-render on data change
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory === 'barang' && p.category !== 'barang') return false;
      if (selectedCategory === 'jasa' && p.category !== 'jasa') return false;
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'barang' &&
        selectedCategory !== 'jasa' &&
        p.sub_category !== selectedCategory
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.sub_category && p.sub_category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedCategory, search, refreshKey]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormCode('PRD-' + Math.floor(1000 + Math.random() * 9000));
    setFormName('');
    setFormCategory('barang');
    setFormSubCategory('Oli & Pelumas');
    setFormPrice('');
    setFormCostPrice('');
    setFormStock(10);
    setFormMinStock(3);
    setFormUnit('Pcs');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormSubCategory(p.sub_category || '');
    setFormPrice(p.price.toString());
    setFormCostPrice(p.cost_price ? p.cost_price.toString() : '0');
    setFormStock(p.stock);
    setFormMinStock(p.min_stock);
    setFormUnit(p.unit || (p.category === 'jasa' ? 'Jasa' : 'Pcs'));
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseRupiah(formPrice);
    const costPriceNum = parseRupiah(formCostPrice);

    if (!formName || priceNum <= 0) {
      error('Nama produk dan harga jual wajib diisi dengan benar!');
      return;
    }

    BengkelStorage.saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      code: formCode,
      name: formName,
      category: formCategory,
      sub_category: formSubCategory || (formCategory === 'jasa' ? 'Jasa Servis' : 'Umum'),
      price: priceNum,
      cost_price: costPriceNum,
      stock: formCategory === 'jasa' ? 999 : Number(formStock),
      min_stock: formCategory === 'jasa' ? 0 : Number(formMinStock),
      unit: formCategory === 'jasa' ? 'Jasa' : formUnit,
    });

    success(
      editingProduct ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!'
    );
    setIsModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      BengkelStorage.deleteProduct(id);
      success('Produk berhasil dihapus!');
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleQuickStock = (id: string, delta: number) => {
    const p = products.find((item) => item.id === id);
    if (!p) return;
    const newStock = Math.max(0, p.stock + delta);
    BengkelStorage.updateProductStock(id, newStock);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Master Data Barang & Jasa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola katalog sparepart, oli pelumas, stok inventori, dan biaya jasa servis.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-soft self-start transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Barang / Jasa</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode barang, nama oli, sparepart..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-soft-sm"
          />
        </div>

        <div className="sm:col-span-4 flex rounded-xl border border-slate-200/80 p-1 bg-white shadow-soft-sm">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'barang', label: 'Barang' },
            { id: 'jasa', label: 'Jasa' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors',
                selectedCategory === tab.id
                  ? 'bg-indigo-600 text-white shadow-soft-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop View: Responsive Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Kode & Nama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Harga Jual</th>
                <th className="px-4 py-3">Harga Beli</th>
                <th className="px-4 py-3 text-center">Stok / Quick Update</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isJasa = p.category === 'jasa';
                  const isLow = !isJasa && p.stock <= p.min_stock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[11px] text-slate-400 font-semibold block">
                          {p.code}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={isJasa ? 'jasa' : 'barang'} size="sm">
                          {p.sub_category || (isJasa ? 'Jasa' : 'Barang')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-indigo-600 text-sm">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {p.cost_price ? formatRupiah(p.cost_price) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isJasa ? (
                          <span className="text-slate-400 font-medium">∞ (Jasa)</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleQuickStock(p.id, -1)}
                              disabled={p.stock <= 0}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors disabled:opacity-30"
                            >
                              -
                            </button>
                            <span
                              className={cn(
                                'font-mono font-bold px-2 py-0.5 rounded-md min-w-[36px] text-center',
                                p.stock === 0
                                  ? 'bg-rose-100 text-rose-700 font-black'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              )}
                            >
                              {p.stock}
                            </span>
                            <button
                              onClick={() => handleQuickStock(p.id, 1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada data barang atau jasa yang sesuai.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View: Card List */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => {
            const isJasa = p.category === 'jasa';
            const isLow = !isJasa && p.stock <= p.min_stock;

            return (
              <div
                key={p.id}
                className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold block">
                      {p.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                  </div>
                  <Badge variant={isJasa ? 'jasa' : 'barang'} size="sm">
                    {p.sub_category || (isJasa ? 'Jasa' : 'Barang')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                    <span className="text-sm font-extrabold text-indigo-600">
                      {formatRupiah(p.price)}
                    </span>
                  </div>

                  {!isJasa ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickStock(p.id, -1)}
                        disabled={p.stock <= 0}
                        className="w-7 h-7 rounded-lg bg-slate-100 active:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-30"
                      >
                        -
                      </button>
                      <span
                        className={cn(
                          'font-mono font-bold px-2 py-0.5 rounded-lg text-xs min-w-[32px] text-center',
                          p.stock === 0
                            ? 'bg-rose-100 text-rose-700 font-black'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        )}
                      >
                        {p.stock}
                      </span>
                      <button
                        onClick={() => handleQuickStock(p.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 active:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Jasa Servis</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Tidak ada data ditemukan.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Master Data' : 'Tambah Barang / Jasa Baru'}
        description="Lengkapi informasi harga, kategori, dan batas minimum stok."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {/* Category Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipe Produk</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormCategory('barang')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all',
                  formCategory === 'barang'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-soft-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                <Package className="w-4 h-4" />
                <span>Barang / Sparepart Fisik</span>
              </button>
              <button
                type="button"
                onClick={() => setFormCategory('jasa')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all',
                  formCategory === 'jasa'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-soft-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                <Wrench className="w-4 h-4" />
                <span>Jasa Servis / Ongkos Kerja</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU / Part</label>
              <input
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Kategori</label>
              <input
                type="text"
                placeholder="Cth: Oli, CVT, Rem, Ban"
                value={formSubCategory}
                onChange={(e) => setFormSubCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk / Jasa *</label>
            <input
              type="text"
              required
              placeholder="Cth: Oli Shell Advance AX7 10W-40"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp) *</label>
              <input
                type="number"
                required
                placeholder="55000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 font-bold text-indigo-600 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Harga Modal / Beli (Rp)</label>
              <input
                type="number"
                placeholder="42000"
                value={formCostPrice}
                onChange={(e) => setFormCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {formCategory === 'barang' && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Stok Awal</label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Min. Stok</label>
                <input
                  type="number"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Satuan</label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-soft"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
