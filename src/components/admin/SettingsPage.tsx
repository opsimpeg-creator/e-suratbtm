import React, { useState } from 'react';
import { SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { OperatingHoursManagement } from './OperatingHoursManagement';
import { ConfirmModal } from '../common/ConfirmModal';
import { Settings, Save, Check, Upload, RefreshCw, Download, FileUp, AlertTriangle } from 'lucide-react';

interface SettingsPageProps {
  settings: SchoolSettings;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onRefresh }) => {
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleChange = (field: keyof SchoolSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(formData);
    onRefresh();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Database_E-Surat_TU_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const str = event.target?.result as string;
        const ok = StorageService.importBackupJSON(str);
        if (ok) {
          setImportStatus('Database berhasil dipulihkan dari backup JSON!');
          onRefresh();
        } else {
          setImportStatus('Gagal memulihkan database. File tidak valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmFactoryReset = () => {
    StorageService.resetToFactory();
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pengaturan Identitas</span>
        <h2 className="text-xl font-extrabold text-slate-900">Setting Identitas Sekolah</h2>
        <p className="text-xs text-slate-500">
          Ubah informasi identitas resmi sekolah dan kontak utama pelayanan Tata Usaha.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8 text-xs">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan sekolah berhasil disimpan!</span>
          </div>
        )}

        {/* Section 1: School Identity */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
            Identitas Lengkap Sekolah
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Sekolah Utama *</label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-extrabold text-blue-900 text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sub Judul Kop (Dinas Pendidikan) *</label>
              <input
                type="text"
                value={formData.schoolSubTitle}
                onChange={(e) => handleChange('schoolSubTitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Sekolah *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Telepon TU *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Resmi *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Admin Staf TU</label>
              <input
                type="text"
                value={formData.waAdminNumber}
                onChange={(e) => handleChange('waAdminNumber', e.target.value)}
                placeholder="081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Master Data Kelas & Jurusan */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
            Master Pilihan Kelas & Konsentrasi Keahlian / Jurusan
          </h3>
          <p className="text-slate-500 text-[11px]">
            Daftar opsi ini digunakan sebagai data acuan utama untuk pilihan dropdown formulir pengajuan surat siswa dan alumni. Pisahkan setiap pilihan dengan tanda koma <code>,</code>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Daftar Master Tingkat & Rombel Kelas (Pisahkan tanda koma)
              </label>
              <textarea
                rows={4}
                value={(formData.classes || []).join(', ')}
                onChange={(e) =>
                  handleChange(
                    'classes',
                    e.target.value.split(',').map((c) => c.trim()).filter(Boolean)
                  )
                }
                placeholder="X (Sepuluh), X-A (Sepuluh A), X-B (Sepuluh B), XI (Sebelas)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Jumlah terdaftar: <strong>{(formData.classes || []).length} kelas</strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Daftar Master Konsentrasi Keahlian / Jurusan (Pisahkan tanda koma)
              </label>
              <textarea
                rows={4}
                value={(formData.majors || []).join(', ')}
                onChange={(e) =>
                  handleChange(
                    'majors',
                    e.target.value.split(',').map((m) => m.trim()).filter(Boolean)
                  )
                }
                placeholder="Teknik Jaringan Komputer dan Telekomunikasi (TJKT), Broadcasting dan Perfilman (BP), AKL, DKV, DPIB, TAB..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Jumlah terdaftar: <strong>{(formData.majors || []).length} jurusan</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Official Signatories */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
            Pejabat Penandatangan Surat (Kepala Sekolah & Kasubag Tata Usaha)
          </h3>
          <p className="text-slate-500 text-[11px]">
            Data ini akan ditampilkan secara otomatis pada halaman Verifikasi QR, Sistem Informasi Keabsahan Surat, serta Kop Surat Resmi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah / Penandatangan Utama *</label>
              <input
                type="text"
                value={formData.headmasterName || ''}
                onChange={(e) => handleChange('headmasterName', e.target.value)}
                placeholder="Drs. H. Ahmad Rizky, M.Pd."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.headmasterNIP || ''}
                onChange={(e) => handleChange('headmasterNIP', e.target.value)}
                placeholder="19750101 200003 1 001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Kasubag Tata Usaha (TU)</label>
              <input
                type="text"
                value={formData.tuHeadName || ''}
                onChange={(e) => handleChange('tuHeadName', e.target.value)}
                placeholder="H. Muhammad Noor, S.Sos."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">NIP Kasubag Tata Usaha (TU)</label>
              <input
                type="text"
                value={formData.tuHeadNIP || ''}
                onChange={(e) => handleChange('tuHeadNIP', e.target.value)}
                placeholder="19800512 200501 1 002"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl text-xs shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Utama</span>
          </button>
        </div>
      </form>

      {/* Operating Hours & Ramadan Management Component */}
      <OperatingHoursManagement settings={settings} onRefresh={onRefresh} />

      {/* Database Backup & Restore Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
          Pencadangan & Pemulihan Database (Backup / Restore)
        </h3>

        {importStatus && <p className="text-xs font-bold text-emerald-700">{importStatus}</p>}

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <button
            type="button"
            onClick={handleExportBackup}
            className="bg-slate-800 hover:bg-black text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Backup JSON</span>
          </button>

          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl border border-slate-300 transition flex items-center gap-2">
            <FileUp className="w-4 h-4 text-blue-600" />
            <span>Import Restore JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="ml-auto bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-xl border border-rose-200 transition flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Reset Database Ke Setelan Pabrik</span>
          </button>
        </div>
      </div>

      {/* Factory Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmFactoryReset}
        title="Reset Database ke Setelan Awal Pabrik?"
        message="PERINGATAN! Tindakan ini akan menghapus seluruh data permohonan, setting identitas sekolah, dan template surat yang telah diubah, lalu mengembalikannya ke pengaturan bawaan awal. Tindakan ini TIDAK dapat dibatalkan."
        confirmText="Ya, Reset Ke Setelan Pabrik"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};
