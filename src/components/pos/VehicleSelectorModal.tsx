'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Vehicle } from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { Car, Search, Plus, User, Phone, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/stores/useToastStore';

interface VehicleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  selectedVehicleId?: string;
}

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectVehicle,
  selectedVehicleId,
}) => {
  const { success } = useToastStore();
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New vehicle form state
  const [plateNumber, setPlateNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  const vehicles = BengkelStorage.getVehicles();

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.plate_number.toLowerCase().includes(q) ||
      v.owner_name.toLowerCase().includes(q) ||
      v.vehicle_type.toLowerCase().includes(q)
    );
  });

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !ownerName) return;

    const saved = BengkelStorage.saveVehicle({
      plate_number: plateNumber,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      vehicle_type: vehicleType || 'Sepeda Motor',
    });

    success(`Kendaraan ${saved.plate_number} berhasil disimpan!`);
    onSelectVehicle(saved);
    setIsAddingNew(false);
    setPlateNumber('');
    setOwnerName('');
    setOwnerPhone('');
    setVehicleType('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-indigo-600">
          <Car className="w-5 h-5" />
          <span>Pilih / Input Kendaraan Pelanggan</span>
        </div>
      }
      description="Hubungkan transaksi dengan nomor polisi & data pemilik motor"
      maxWidth="md"
    >
      {!isAddingNew ? (
        <div className="space-y-3.5">
          {/* Search & Add New Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Plat (cth: B 1234) atau Nama..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base sm:text-sm"
              />
            </div>
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Baru</span>
            </button>
          </div>

          {/* Vehicle List */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      onSelectVehicle(v);
                      onClose();
                    }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group',
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 shadow-soft-sm'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase',
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                        )}
                      >
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-800 tracking-wide font-mono">
                            {v.plate_number}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                              Terpilih
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {v.owner_name} • {v.vehicle_type}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Kendaraan tidak ditemukan.</p>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Tambah Kendaraan Baru
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Form Tambah Kendaraan Baru */
        <form onSubmit={handleCreateVehicle} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Polisi (Plat Nomor) *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: B 1234 ABC"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 uppercase font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Pemilik / Pelanggan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipe / Model Motor
              </label>
              <input
                type="text"
                placeholder="Contoh: Honda Vario 125"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp / HP
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Kembali ke Daftar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-soft"
            >
              Simpan & Pilih
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
