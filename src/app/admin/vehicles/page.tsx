'use client';

import React, { useState, useMemo } from 'react';
import { Vehicle, Transaction } from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { formatDateIndo, formatRupiah } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useToastStore } from '@/stores/useToastStore';
import { useDataStore } from '@/stores/useDataStore';
import {
  Car,
  Search,
  Plus,
  Phone,
  Calendar,
  History,
  Edit2,
  ChevronRight,
  Receipt,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VehiclesManagementPage() {
  const { success, error } = useToastStore();
  const { vehicles, transactions: allTransactions, saveVehicle } = useDataStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<Vehicle | null>(null);

  // Form State
  const [plateNumber, setPlateNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [notes, setNotes] = useState('');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          v.plate_number.toLowerCase().includes(q) ||
          v.owner_name.toLowerCase().includes(q) ||
          v.vehicle_type.toLowerCase().includes(q) ||
          (v.owner_phone && v.owner_phone.includes(q))
        );
      }
      return true;
    });
  }, [vehicles, search]);

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setPlateNumber('');
    setOwnerName('');
    setOwnerPhone('');
    setVehicleType('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setPlateNumber(v.plate_number);
    setOwnerName(v.owner_name);
    setOwnerPhone(v.owner_phone || '');
    setVehicleType(v.vehicle_type);
    setNotes(v.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !ownerName) {
      error('Nomor Polisi dan Nama Pemilik wajib diisi!');
      return;
    }

    await saveVehicle({
      id: editingVehicle ? editingVehicle.id : undefined,
      plate_number: plateNumber,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      vehicle_type: vehicleType || 'Sepeda Motor',
      notes,
    });

    success(
      editingVehicle ? 'Data kendaraan diperbarui!' : 'Kendaraan baru berhasil didaftarkan!'
    );
    setIsModalOpen(false);
  };

  // Get service history for selected vehicle
  const vehicleServiceHistory = useMemo(() => {
    if (!selectedVehicleForHistory) return [];
    return allTransactions.filter(
      (t) =>
        t.vehicle_id === selectedVehicleForHistory.id ||
        (t.vehicle_plate &&
          t.vehicle_plate.toUpperCase() === selectedVehicleForHistory.plate_number.toUpperCase())
    );
  }, [selectedVehicleForHistory, allTransactions]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Kendaraan & CRM Bengkel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Database nomor polisi kendaraan, kontak pelanggan, dan riwayat servis berkala.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-soft self-start transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kendaraan Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari Plat Nomor (B 1234), Nama Pemilik, Tipe Motor..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-soft-sm"
        />
      </div>

      {/* Vehicle Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((v) => (
            <div
              key={v.id}
              className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm hover:border-indigo-300 transition-all space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-900 tracking-wide font-mono block">
                      {v.plate_number}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{v.vehicle_type}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEditModal(v)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit Data"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Owner info */}
              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pemilik:</span>
                  <span className="font-bold text-slate-800">{v.owner_name}</span>
                </div>
                {v.owner_phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Telepon/WA:</span>
                    <a
                      href={`https://wa.me/${v.owner_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{v.owner_phone}</span>
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Servis Terakhir:</span>
                  <span className="font-medium">
                    {v.last_service_date ? formatDateIndo(v.last_service_date) : 'Belum tercatat'}
                  </span>
                </div>
                {v.notes && (
                  <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                    Catatan: {v.notes}
                  </div>
                )}
              </div>

              {/* Action: View Service History */}
              <button
                onClick={() => setSelectedVehicleForHistory(v)}
                className="w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>Lihat Riwayat Servis</span>
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-8">
            <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Tidak ada kendaraan ditemukan.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Data Kendaraan' : 'Tambah Kendaraan Baru'}
        description="Catat identitas plat nomor, pemilik, dan tipe kendaraan."
        maxWidth="md"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Polisi (Plat Nomor) *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: B 3829 SJA"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 font-mono uppercase font-bold bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Pemilik Pelanggan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Hartono"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kendaraan</label>
              <input
                type="text"
                placeholder="Contoh: Honda Vario 125"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
              <input
                type="tel"
                placeholder="081234567890"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Khusus</label>
            <textarea
              rows={2}
              placeholder="Catatan riwayat keluhan, spesifikasi oli yang dipakai, dll."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-soft"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Service History Modal */}
      <Modal
        isOpen={!!selectedVehicleForHistory}
        onClose={() => setSelectedVehicleForHistory(null)}
        title={
          <div className="flex items-center gap-2 text-indigo-600">
            <History className="w-5 h-5" />
            <span>Riwayat Servis Kendaraan</span>
          </div>
        }
        description={
          selectedVehicleForHistory
            ? `${selectedVehicleForHistory.plate_number} • ${selectedVehicleForHistory.owner_name}`
            : ''
        }
        maxWidth="lg"
      >
        {selectedVehicleForHistory && (
          <div className="space-y-3">
            {vehicleServiceHistory.length > 0 ? (
              vehicleServiceHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {tx.invoice_no}
                      </span>
                      <p className="text-[11px] text-slate-400">{formatDateIndo(tx.created_at)}</p>
                    </div>
                    <span className="font-extrabold text-sm text-indigo-600">
                      {formatRupiah(tx.total_amount)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200/60 pt-2">
                    {tx.details.map((d, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {d.qty}x {d.product_name}
                        </span>
                        <span className="font-medium">{formatRupiah(d.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Belum ada riwayat transaksi servis untuk kendaraan ini.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
