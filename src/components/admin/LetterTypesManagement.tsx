import React, { useState } from 'react';
import { LetterType } from '../../types';
import { StorageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sliders,
  Clock,
  FileText,
  Eye,
  EyeOff,
  ArrowUpDown
} from 'lucide-react';

interface LetterTypesManagementProps {
  letterTypes: LetterType[];
  onRefresh: () => void;
  onOpenFormBuilder: (type: LetterType) => void;
}

export const LetterTypesManagement: React.FC<LetterTypesManagementProps> = ({
  letterTypes,
  onRefresh,
  onOpenFormBuilder,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LetterType | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<LetterType | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [processingTimeDays, setProcessingTimeDays] = useState(1);
  const [color, setColor] = useState('bg-blue-600');
  const [active, setActive] = useState(true);

  const openAddModal = () => {
    setEditingType(null);
    setCode('');
    setName('');
    setDescription('');
    setProcessingTimeDays(1);
    setColor('bg-blue-600');
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (t: LetterType) => {
    setEditingType(t);
    setCode(t.code);
    setName(t.name);
    setDescription(t.description);
    setProcessingTimeDays(t.processingTimeDays);
    setColor(t.color);
    setActive(t.active);
    setModalOpen(true);
  };

  const handleToggleActive = (t: LetterType) => {
    StorageService.updateLetterType(t.id, { active: !t.active });
    onRefresh();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    StorageService.deleteLetterType(deleteTarget.id);
    onRefresh();
    setDeleteTarget(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      StorageService.updateLetterType(editingType.id, {
        code,
        name,
        description,
        processingTimeDays,
        color,
        active,
      });
    } else {
      StorageService.addLetterType({
        code,
        name,
        description,
        processingTimeDays,
        iconName: 'FileText',
        color,
        active,
        order: letterTypes.length + 1,
      });
    }
    onRefresh();
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manajemen Jenis Surat</h2>
          <p className="text-xs text-slate-500">
            Tambah, ubah, atau atur kolom formulir dinamis untuk tiap jenis persuratan.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jenis Surat Baru</span>
        </button>
      </div>

      {/* Letter Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {letterTypes.map((t) => {
          const fieldsCount = StorageService.getFieldsForLetterType(t.id).length;

          return (
            <div
              key={t.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between transition ${
                t.active ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center ${t.color}`}>
                    {t.code}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        t.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {t.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{t.active ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {t.processingTimeDays} Hari Kerja
                  </span>
                  <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {fieldsCount} Kolom Form
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => onOpenFormBuilder(t)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 flex-1 justify-center"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Form Builder</span>
                </button>

                <button
                  onClick={() => openEditModal(t)}
                  className="p-2 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  title="Edit Jenis Surat"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget(t)}
                  className="p-2 text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-xl transition"
                  title="Hapus Jenis Surat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingType ? 'Edit Jenis Surat' : 'Tambah Jenis Surat Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Singkat Surat *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: SKAS, SKA, SRB"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Jenis Surat *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Surat Keterangan Aktif Sekolah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan fungsi dan peruntukan surat ini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Hari Kerja</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={processingTimeDays}
                    onChange={(e) => setProcessingTimeDays(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Warna Akses Kartu</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="bg-blue-600">Biru (Default)</option>
                    <option value="bg-indigo-600">Nila (Indigo)</option>
                    <option value="bg-emerald-600">Hijau Emerald</option>
                    <option value="bg-amber-600">Oranye Amber</option>
                    <option value="bg-purple-600">Ungu</option>
                    <option value="bg-rose-600">Merah Rose</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md"
                >
                  Simpan Jenis Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Letter Type Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Jenis Surat?"
        message="Apakah Anda yakin ingin menghapus jenis surat ini? Seluruh rancangan kolom formulir terkait jenis surat ini juga akan terhapus."
        confirmText="Ya, Hapus Jenis Surat"
        cancelText="Batal"
        variant="danger"
        itemDetails={
          deleteTarget
            ? [
                {
                  label: 'Kode',
                  value: deleteTarget.code,
                  isBadge: true,
                  badgeColor: 'bg-blue-100 text-blue-800',
                },
                {
                  label: 'Nama Surat',
                  value: deleteTarget.name,
                },
              ]
            : undefined
        }
      />
    </div>
  );
};
