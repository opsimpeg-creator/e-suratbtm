import React, { useState, useEffect } from 'react';
import { SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import { OperatingHoursManagement } from './OperatingHoursManagement';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Settings,
  Save,
  Check,
  Upload,
  RefreshCw,
  Download,
  FileUp,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Database,
  Users,
  Building2,
  HelpCircle,
  X
} from 'lucide-react';

interface SettingsPageProps {
  settings: SchoolSettings;
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onRefresh, onNavigateTab }) => {
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [classesText, setClassesText] = useState<string>((settings.classes || []).join(', '));
  const [majorsText, setMajorsText] = useState<string>((settings.majors || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Synchronize when settings prop changes from Firestore / background refresh
  useEffect(() => {
    setFormData(settings);
    setClassesText((settings.classes || []).join(', '));
    setMajorsText((settings.majors || []).join(', '));
  }, [settings]);

  const handleChange = (field: keyof SchoolSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedClasses = classesText
      .split(/[\n,]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    const parsedMajors = majorsText
      .split(/[\n,]+/)
      .map((m) => m.trim())
      .filter(Boolean);

    const updatedSettings: SchoolSettings = {
      ...formData,
      appName: formData.appName?.trim() || 'LAPIS SMAKTUDI',
      city: formData.city?.trim() || 'Batumandi',
      classes: parsedClasses.length > 0 ? parsedClasses : formData.classes,
      majors: parsedMajors.length > 0 ? parsedMajors : formData.majors,
    };

    StorageService.saveSettings(updatedSettings);
    onRefresh();

    // Persist official settings (Headmaster, TU Head, School Info) to Google Spreadsheet Setting sheet
    AppsScriptService.syncSettingsToAppsScript(updatedSettings).catch((err) => {
      console.warn('Sync settings to Apps Script error:', err);
    });

    // Also persist updated classes & majors to MasterKelas and MasterJurusan sheets
    AppsScriptService.syncMasterDataToSpreadsheet(
      updatedSettings.classes,
      updatedSettings.majors
    ).catch((err) => {
      console.warn('Sync master classes/majors to Apps Script error:', err);
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pengaturan Identitas & Branding</span>
        <h2 className="text-xl font-extrabold text-slate-900">Setting Identitas Sekolah & Aplikasi</h2>
        <p className="text-xs text-slate-500">
          Ubah nama aplikasi, nama sekolah, kota titimangsa surat, logo kop, dan kontak utama pelayanan Tata Usaha.
        </p>
      </div>

      {/* Panduan Ringkas 3 Langkah untuk Sekolah Baru (Smart Collapsible / Non-Intrusive) */}
      <div className="bg-linear-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md space-y-4 border border-blue-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/50 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm sm:text-base">
                  Panduan Ringkas 3 Langkah Setup untuk Sekolah Baru
                </h3>
                <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/20">
                  White-label Siap Pakai
                </span>
              </div>
              <p className="text-blue-200 text-xs mt-0.5">
                {showSetupGuide
                  ? 'Ikuti 3 tahapan mudah berikut agar aplikasi siap digunakan untuk sekolah Anda.'
                  : 'Aplikasi ini dirancang fleksibel untuk sekolah mana pun. Klik untuk melihat panduan setup cepat.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition border border-white/20 cursor-pointer shrink-0"
          >
            {showSetupGuide ? (
              <>
                <span>Sembunyikan Panduan</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <span>Buka Panduan Setup</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 3 Step Status Bar (Always visible overview) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
              <span className="text-xs font-semibold text-white">1. Identitas & Nama App</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              {formData.schoolName ? 'Siap ✓' : 'Perlu Diisi'}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="text-xs font-semibold text-white">2. Google Spreadsheet</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              {formData.spreadsheetId ? 'Terhubung ✓' : 'Belum Ada'}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-xs font-semibold text-white">3. Akun Staf TU</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              Siap ✓
            </span>
          </div>
        </div>

        {/* Expandable Step Details */}
        {showSetupGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            {/* Step 1 */}
            <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/15">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-[11px]">1</span>
                <span>Ubah Identitas & Nama App</span>
              </div>
              <p className="text-blue-100 text-[11px] leading-relaxed">
                Ubah <b>Nama Aplikasi</b> (misal: <i>SIPESAT</i>, <i>LAPIS</i>), <b>Nama Sekolah</b>, <b>Kota Asal</b>, serta upload logo sekolah pada formulir di bawah ini.
              </p>
              <div className="text-[10px] text-emerald-300 font-medium pt-1">
                ✓ Selesaikan langsung di halaman ini & klik Simpan.
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center font-bold text-[11px]">2</span>
                  <span>Hubungkan Spreadsheet</span>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed mt-2">
                  Buka menu <b>Sync Google Spreadsheet</b>, tempelkan ID Spreadsheet sekolah Anda, lalu pasang kode Apps Script agar data tersimpan di Google Drive sekolah Anda.
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('sync-spreadsheet')}
                  className="mt-2 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Buka Sync Spreadsheet</span>
                </button>
              )}
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs">
                  <span className="w-5 h-5 rounded-full bg-purple-400 text-slate-900 flex items-center justify-center font-bold text-[11px]">3</span>
                  <span>Atur Akun Staf TU</span>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed mt-2">
                  Buka menu <b>Pengguna & Hak Akses</b> untuk menambahkan email staf TU sekolah Anda atau mereset password akun login admin.
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('pengguna')}
                  className="mt-2 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Buka Pengguna & Hak Akses</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8 text-xs">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan identitas sekolah & aplikasi berhasil disimpan!</span>
          </div>
        )}

        {/* Section 1: School Identity & White-label Branding */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>Identitas Lengkap Sekolah & Branding Aplikasi</span>
            <span className="text-[11px] font-normal text-slate-400">Tanda * wajib diisi</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field: Nama Aplikasi / Branding */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Aplikasi / Branding Layanan *
              </label>
              <input
                type="text"
                value={formData.appName || ''}
                onChange={(e) => handleChange('appName', e.target.value)}
                placeholder="Contoh: LAPIS SMAKTUDI, SIPESAT SMANSA, dll."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-extrabold text-blue-900 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ditampilkan pada navbar publik, dashboard admin, dan tab browser.
              </span>
            </div>

            {/* Field: Kota / Kabupaten Asal */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kota / Kabupaten Asal Sekolah (Titimangsa Surat) *
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Contoh: Batumandi, Balangan, Banjarmasin, dll."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Digunakan pada titimangsa surat resmi PDF (misal: <i>Batumandi, 20 September 2026</i>).
              </span>
            </div>

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
                value={classesText}
                onChange={(e) => setClassesText(e.target.value)}
                placeholder="X (Sepuluh), X-A (Sepuluh A), X-B (Sepuluh B), XI (Sebelas)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Jumlah terdaftar:{' '}
                <strong>
                  {
                    classesText
                      .split(/[\n,]+/)
                      .map((c) => c.trim())
                      .filter(Boolean).length
                  }{' '}
                  kelas
                </strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Daftar Master Konsentrasi Keahlian / Jurusan (Pisahkan tanda koma)
              </label>
              <textarea
                rows={4}
                value={majorsText}
                onChange={(e) => setMajorsText(e.target.value)}
                placeholder="Teknik Jaringan Komputer dan Telekomunikasi (TJKT), Broadcasting dan Perfilman (BP), AKL, DKV, DPIB, TAB..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Jumlah terdaftar:{' '}
                <strong>
                  {
                    majorsText
                      .split(/[\n,]+/)
                      .map((m) => m.trim())
                      .filter(Boolean).length
                  }{' '}
                  jurusan
                </strong>
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
            disabled={isSaving}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl text-xs shadow-md transition flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Cloud...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Utama</span>
              </>
            )}
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
