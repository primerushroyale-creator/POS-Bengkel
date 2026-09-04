'use client';

import React, { useState, useMemo } from 'react';
import { WorkOrder, WorkOrderStatus, Vehicle } from '@/types';
import { BengkelStorage } from '@/lib/storage';
import { formatDateIndo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToastStore } from '@/stores/useToastStore';
import { useDataStore } from '@/stores/useDataStore';
import {
  ClipboardList,
  Plus,
  Search,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  User,
  Gauge,
  Car,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkOrdersPage() {
  const { success, error } = useToastStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [mileage, setMileage] = useState<number>(0);
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  const {
    workOrders,
    vehicles,
    saveWorkOrder,
    updateWorkOrderStatus,
  } = useDataStore();
  const users = BengkelStorage.getUsers();
  const mechanics = users.filter((u) => u.role === 'mekanik' || u.role === 'admin');

  const filteredOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (wo.invoice_no && wo.invoice_no.toLowerCase().includes(q)) ||
          (wo.vehicle_plate && wo.vehicle_plate.toLowerCase().includes(q)) ||
          (wo.owner_name && wo.owner_name.toLowerCase().includes(q)) ||
          (wo.mechanic_name && wo.mechanic_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [workOrders, statusFilter, search]);

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setSelectedVehicleId(vehicles[0]?.id || '');
    setSelectedMechanicId(mechanics[0]?.id || '');
    setMileage(0);
    setComplaint('');
    setDiagnosis('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSaveWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      error('Pilih kendaraan untuk SPK Servis!');
      return;
    }

    const veh = vehicles.find((v) => v.id === selectedVehicleId);
    const mech = mechanics.find((m) => m.id === selectedMechanicId);

    await saveWorkOrder({
      id: editingOrder ? editingOrder.id : undefined,
      vehicle_id: selectedVehicleId,
      vehicle_plate: veh?.plate_number,
      vehicle_type: veh?.vehicle_type,
      owner_name: veh?.owner_name,
      mechanic_id: selectedMechanicId,
      mechanic_name: mech?.name,
      mileage: Number(mileage),
      complaint,
      diagnosis,
      notes,
    });

    success(editingOrder ? 'SPK Servis diperbarui!' : 'SPK Servis baru dibuat!');
    setIsModalOpen(false);
  };

  const handleStatusChange = async (id: string, newStatus: WorkOrderStatus) => {
    await updateWorkOrderStatus(id, newStatus);
    success(`Status SPK diubah menjadi ${newStatus.toUpperCase()}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Surat Perintah Kerja (SPK) & Antrian Servis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen alur kerja bengkel, pembagian tugas mekanik, dan catatan diagnostik motor.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-soft self-start transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat SPK Servis Baru</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. SPK, Plat Nomor, Mekanik, Pemilik..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-soft-sm"
          />
        </div>

        <div className="sm:col-span-5 flex rounded-xl border border-slate-200/80 p-1 bg-white shadow-soft-sm">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Antri (Pending)' },
            { id: 'in_progress', label: 'Dikerjakan' },
            { id: 'completed', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'flex-1 py-1 rounded-lg text-xs font-bold transition-colors',
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-soft-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((wo) => {
            const isPending = wo.status === 'pending';
            const isInProgress = wo.status === 'in_progress';
            const isCompleted = wo.status === 'completed';

            return (
              <div
                key={wo.id}
                className={cn(
                  'p-4 sm:p-5 bg-white rounded-2xl border shadow-soft-sm transition-all space-y-3 flex flex-col justify-between',
                  isInProgress
                    ? 'border-indigo-300 shadow-soft-md ring-1 ring-indigo-300/50'
                    : 'border-slate-200/80'
                )}
              >
                <div>
                  {/* Top: SPK No & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-800 block">
                        {wo.invoice_no || 'SPK Servis'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateIndo(wo.created_at)}
                      </span>
                    </div>

                    <Badge
                      variant={isCompleted ? 'success' : isInProgress ? 'primary' : 'warning'}
                      size="sm"
                    >
                      {isCompleted ? 'Selesai' : isInProgress ? 'Dikerjakan' : 'Antrian'}
                    </Badge>
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5 mb-2.5">
                    <Car className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-mono font-extrabold text-xs text-slate-900 block">
                        {wo.vehicle_plate}
                      </span>
                      <p className="text-[11px] text-slate-500 truncate">
                        {wo.owner_name} • {wo.vehicle_type}
                      </p>
                    </div>
                  </div>

                  {/* Details: Mileage, Mechanic, Complaint */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Mekanik:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {wo.mechanic_name || 'Belum ditugaskan'}
                      </span>
                    </div>

                    {wo.mileage ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-amber-500" />
                          <span>Odometer:</span>
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {wo.mileage.toLocaleString('id-ID')} KM
                        </span>
                      </div>
                    ) : null}

                    {wo.complaint && (
                      <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-100/60 mt-1">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block mb-0.5">
                          Keluhan Pelanggan:
                        </span>
                        <p className="text-[11px] text-slate-700">{wo.complaint}</p>
                      </div>
                    )}

                    {wo.diagnosis && (
                      <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/60 mt-1">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase block mb-0.5">
                          Hasil Diagnosis Mekanik:
                        </span>
                        <p className="text-[11px] text-slate-700">{wo.diagnosis}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5">
                  {isPending && (
                    <button
                      onClick={() => handleStatusChange(wo.id, 'in_progress')}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-soft"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Mulai Kerjakan</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => handleStatusChange(wo.id, 'completed')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-soft"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Servis Selesai</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-8">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Tidak ada SPK Servis yang cocok.</p>
          </div>
        )}
      </div>

      {/* Add / Edit SPK Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Surat Perintah Kerja (SPK) Baru"
        description="Pilih kendaraan, tugaskan mekanik, dan catat keluhan motor."
        maxWidth="md"
      >
        <form onSubmit={handleSaveWorkOrder} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Kendaraan Pelanggan *
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} - {v.owner_name} ({v.vehicle_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tugaskan Mekanik</label>
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kilometer (KM)</label>
              <input
                type="number"
                placeholder="25000"
                value={mileage || ''}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keluhan Pelanggan</label>
            <textarea
              rows={2}
              placeholder="Contoh: Bunyi gredek di tarikan awal, rem depan kurang pakem..."
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Diagnosis Mekanik
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Roller aus, v-belt retak halus, kampas rem depan sisa 20%"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
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
              Buat SPK
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
