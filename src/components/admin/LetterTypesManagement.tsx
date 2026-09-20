import React, { useState } from 'react';
import { LetterType } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import { ConfirmModal } from '../common/ConfirmModal';
import { LetterIcon, AVAILABLE_LETTER_ICONS } from '../common/LetterIcon';
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
  ArrowUpDown,
  RefreshCw,
  Upload,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Palette
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<LetterType | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [processingTimeDays, setProcessingTimeDays] = useState(1);
  const [iconName, setIconName] = useState('FileText');
  const [color, setColor] = useState('bg-blue-600');
  const [active, setActive] = useState(true);

  const openAddModal = () => {
    setEditingType(null);
    setCode('');
    setName('');
    setDescription('');
    setProcessingTimeDays(1);
    setIconName('FileText');
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
    setIconName(t.iconName || 'FileText');
    setColor(t.color || 'bg-blue-600');
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
        iconName,
        color,
        active,
      });
    } else {
      StorageService.addLetterType({
        code,
        name,
        description,
        processingTimeDays,
        iconName,
        color,
        active,
        order: letterTypes.length + 1,
      });
    }
    onRefresh();
    setModalOpen(false);
  };

  const handlePullFromSpreadsheet = async () => {
    setIsSyncing(true);
    try {
      const res = await AppsScriptService.fetchLetterTypesFromSpreadsheet();
      setNotice({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        onRefresh();
      }
      setTimeout(() => setNotice(null), 4500);
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: `⚠️ Gagal menarik jenis surat dari Spreadsheet: ${err?.message || 'Error'}`,
      });
      setTimeout(() => setNotice(null), 4500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSpreadsheet = async () => {
    setIsSyncing(true);
    try {
      const isSuccess = await AppsScriptService.syncAllLetterTypesToAppsScript();
      setNotice({
        type: isSuccess ? 'success' : 'error',
        text: isSuccess
          ? 'Berhasil menyinkronkan jenis surat ke Spreadsheet sheet JenisSurat!'
          : 'Gagal menyinkronkan jenis surat ke Spreadsheet.',
      });
      setTimeout(() => setNotice(null), 4500);
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: `⚠️ Gagal mengirim jenis surat ke Spreadsheet: ${err?.message || 'Error'}`,
      });
      setTimeout(() => setNotice(null), 4500);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">Manajemen Jenis Surat</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Database className="w-3 h-3" />
              Sheet: JenisSurat
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Jenis surat yang aktif di database Google Spreadsheet akan ditampilkan di Landing Page publik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={handlePullFromSpreadsheet}
            disabled={isSyncing}
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-slate-300 flex items-center justify-center gap-2 disabled:opacity-50"
            title="Tarik data jenis surat terbaru dari Google Spreadsheet"
          >
            {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-600" />}
            <span>Tarik dari Spreadsheet</span>
          </button>

          <button
            onClick={handlePushToSpreadsheet}
            disabled={isSyncing}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            title="Kirim dan simpan semua jenis surat ke Google Spreadsheet"
          >
            {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>Kirim ke Spreadsheet</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jenis Surat Baru</span>
          </button>
        </div>
      </div>

      {/* Letter Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {letterTypes.map((t) => {
          const fieldsCount = StorageService.getFieldsForLetterType(t.id).length;

          return (
            <div
              key={t.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs hover:shadow-md flex flex-col justify-between transition-all duration-200 ${
                t.active ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-md ${t.color || 'bg-blue-600'}`}>
                      <LetterIcon iconName={t.iconName} className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-200 block w-max">
                        KODE: {t.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Ikon: {t.iconName || 'FileText'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                        t.active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {t.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{t.active ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 flex-1 justify-center shadow-xs cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Form Builder</span>
                </button>

                <button
                  onClick={() => openEditModal(t)}
                  className="p-2 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  title="Edit Jenis Surat & Ikon"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget(t)}
                  className="p-2 text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingType ? 'Edit Jenis Surat' : 'Tambah Jenis Surat Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Konfigurasi kode, ikon visual, dan estimasi waktu proses</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Live Preview Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-md ${color || 'bg-blue-600'}`}>
                    <LetterIcon iconName={iconName} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        KODE: {code || 'KODE'}
                      </span>
                      <span className="text-[11px] text-blue-700 font-semibold">Pratinjau Kartu Publik</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{name || 'Nama Jenis Surat'}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {description || 'Deskripsi jenis surat akan tampil di sini...'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Est. {processingTimeDays} Hari Kerja
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Singkat Surat *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: SKAS, SKA, SPS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Jenis Surat *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Surat Keterangan Aktif Sekolah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan fungsi dan peruntukan surat ini bagi siswa/alumni..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Icon Selector Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih Ikon Visual Surat *</span>
                  </label>
                  <span className="text-[11px] text-blue-700 font-semibold font-mono">
                    Terpilih: {iconName}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2 bg-slate-50/80 rounded-2xl border border-slate-200">
                  {AVAILABLE_LETTER_ICONS.map((opt) => {
                    const isSelected = iconName === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setIconName(opt.name)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <opt.IconComponent className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {opt.name}
                          </p>
                          <p className={`text-[9px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {opt.category}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color & Processing Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Waktu Proses</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={processingTimeDays}
                      onChange={(e) => setProcessingTimeDays(parseInt(e.target.value, 10))}
                      className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Hari Kerja</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                    <span>Warna Tema Kartu</span>
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="bg-blue-600">🔵 Biru (Default)</option>
                    <option value="bg-indigo-600">🟣 Nila (Indigo)</option>
                    <option value="bg-emerald-600">🟢 Hijau Emerald</option>
                    <option value="bg-amber-600">🟠 Oranye Amber</option>
                    <option value="bg-purple-600">🟪 Ungu Purple</option>
                    <option value="bg-rose-600">🔴 Merah Rose</option>
                    <option value="bg-sky-600">🌐 Biru Langit (Sky)</option>
                    <option value="bg-teal-600">🌿 Hijau Toska (Teal)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Jenis Surat</span>
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
