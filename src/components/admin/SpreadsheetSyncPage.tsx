import React, { useState } from 'react';
import { SchoolSettings } from '../../types';
import { AppsScriptService } from '../../services/appsScript';
import { StorageService } from '../../services/storage';
import {
  Database,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Code,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Layers,
  CheckCircle2,
  ArrowRight,
  Archive,
  FileSpreadsheet,
  Link,
  Save,
  RotateCcw
} from 'lucide-react';

interface SpreadsheetSyncPageProps {
  settings: SchoolSettings;
  onRefresh: () => void;
}

export const SpreadsheetSyncPage: React.FC<SpreadsheetSyncPageProps> = ({ settings, onRefresh }) => {
  const [copied, setCopied] = useState(false);
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(settings.spreadsheetId || '');
  const [webAppUrl, setWebAppUrl] = useState(settings.webAppUrl || settings.appScriptWebAppUrl || '');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  // Extract ID if user pastes full Google Spreadsheet URL
  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return trimmed;
  };

  const handleSpreadsheetIdChange = (val: string) => {
    const extracted = extractSpreadsheetId(val);
    setSpreadsheetIdInput(extracted);
  };

  // Live active ID used for generating Code.gs preview dynamically
  const activeSpreadsheetId = (spreadsheetIdInput || settings.spreadsheetId || '').trim();
  const generatedCode = AppsScriptService.generateAppsScriptCode(activeSpreadsheetId || 'MASUKKAN_SPREADSHEET_ID_SEKOLAH_ANDA');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConnection = () => {
    const cleanId = extractSpreadsheetId(spreadsheetIdInput);
    if (!cleanId) {
      alert('Silakan masukkan Spreadsheet ID atau URL Google Spreadsheet target.');
      return;
    }

    StorageService.saveSettings({
      ...settings,
      spreadsheetId: cleanId,
      webAppUrl: webAppUrl.trim(),
      appScriptWebAppUrl: webAppUrl.trim(),
    });
    setSpreadsheetIdInput(cleanId);
    onRefresh();
    setSaveFeedback('Koneksi Spreadsheet ID & Web App URL berhasil disimpan & diaktifkan!');
    setTimeout(() => setSaveFeedback(''), 4000);
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan ID Spreadsheet ke default awal sekolah SMKN 1 Batumandi?')) {
      const defaultId = '1lQ4BNn0l9Qjp06g-QSOilD1I8-2nX4pK7a4qbRv34OI';
      setSpreadsheetIdInput(defaultId);
      StorageService.saveSettings({
        ...settings,
        spreadsheetId: defaultId,
      });
      onRefresh();
      setSaveFeedback('Spreadsheet ID dikembalikan ke default SMKN 1 Batumandi.');
      setTimeout(() => setSaveFeedback(''), 4000);
    }
  };

  const handleTestSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    const res = await AppsScriptService.syncAllToAppsScript();
    setSyncing(false);
    setSyncMessage(res.message);
    StorageService.addAuditLog('admin', 'SYNC_SPREADSHEET', res.message);
    setTimeout(() => setSyncMessage(''), 5000);
  };

  const handlePullData = async () => {
    setSyncing(true);
    setSyncMessage('');
    const res = await AppsScriptService.fetchDataFromAppsScript();
    setSyncing(false);
    setSyncMessage(res.message);
    if (res.success) {
      onRefresh();
    }
    StorageService.addAuditLog('admin', 'FETCH_SPREADSHEET', res.message);
    setTimeout(() => setSyncMessage(''), 5000);
  };

  const handlePullMasterOnly = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await AppsScriptService.fetchMasterDataFromSpreadsheet();
      setSyncMessage(res.message);
      if (res.success) {
        onRefresh();
      }
      StorageService.addAuditLog('admin', 'FETCH_MASTER_SPREADSHEET', res.message);
    } catch (e: any) {
      setSyncMessage('Gagal menarik Master Data: ' + (e?.message || 'Error'));
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const handlePushMasterOnly = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await AppsScriptService.syncMasterDataToSpreadsheet();
      setSyncMessage(res.message);
      StorageService.addAuditLog('admin', 'PUSH_MASTER_SPREADSHEET', res.message);
    } catch (e: any) {
      setSyncMessage('Gagal mengirim Master Data: ' + (e?.message || 'Error'));
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const handleSyncArchive = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await AppsScriptService.syncArchiveToSpreadsheet();
      setSyncMessage(res.message);
      StorageService.addAuditLog('admin', 'SYNC_ARCHIVE_SPREADSHEET', res.message);
      onRefresh();
    } catch (e: any) {
      setSyncMessage('Gagal sinkronisasi arsip: ' + (e?.message || 'Error'));
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-extrabold text-white">Integrasi Direct Google Spreadsheet Database</h2>
        </div>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Aplikasi ini dirancang <b>Spreadsheet-First</b>. Seluruh data permohonan, pengaduan, template surat, serta <b>Master Referensi Kelas & Jurusan</b> dan <b>Sheet Arsip Dokumen</b> tersinkronisasi langsung dengan Google Spreadsheet.
        </p>

        {/* Master Data Snapshot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-200 uppercase font-bold tracking-wider">Sheet: MasterKelas</p>
                <p className="text-sm font-extrabold text-white">{settings.classes?.length || 0} Kelas Terdaftar</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">Auto Dropdown</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-200 uppercase font-bold tracking-wider">Sheet: MasterJurusan</p>
                <p className="text-sm font-extrabold text-white">{settings.majors?.length || 0} Jurusan</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">Auto Dropdown</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-200 uppercase font-bold tracking-wider">Sheet: FieldSurat</p>
                <p className="text-sm font-extrabold text-white">{StorageService.getFormFields().length} Kolom Formulir</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">Dynamic Form</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-200 uppercase font-bold tracking-wider">Sheet: Arsip</p>
                <p className="text-sm font-extrabold text-white">{StorageService.getArchivedDocuments().length} Dokumen Arsip</p>
              </div>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">Masa Berlaku</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
          <a
            href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
          >
            <span>Buka Google Spreadsheet Target</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={handleSyncArchive}
            disabled={syncing}
            className="bg-purple-700 hover:bg-purple-600 text-white border border-purple-500 px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
            title="Migrasi & sinkronkan permohonan selesai ke Sheet Arsip dengan status masa berlaku"
          >
            <Archive className="w-4 h-4 text-purple-200" />
            <span>Sinkronkan ke Sheet Arsip</span>
          </button>

          <button
            onClick={handlePullMasterOnly}
            disabled={syncing}
            className="bg-teal-700 hover:bg-teal-600 text-white border border-teal-500 px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
            title="Tarik hanya Master Data Kelas & Jurusan dari Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 text-teal-200 ${syncing ? 'animate-spin' : ''}`} />
            <span>Tarik Master Kelas/Jurusan</span>
          </button>

          <button
            onClick={handlePushMasterOnly}
            disabled={syncing}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl transition flex items-center gap-2"
            title="Kirim Master Kelas & Jurusan lokal ke Spreadsheet"
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>Kirim Master ke Spreadsheet</span>
          </button>

          <button
            onClick={handlePullData}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
            title="Tarik seluruh permohonan & pengaduan dari Google Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 text-blue-200 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Menarik...' : 'Tarik Semua Data'}</span>
          </button>

          <button
            onClick={handleTestSync}
            disabled={syncing}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-amber-300 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Mengirim...' : 'Kirim Semua ke Spreadsheet'}</span>
          </button>
        </div>

        {syncMessage && (
          <div className="p-3 bg-emerald-800/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-100 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{syncMessage}</span>
          </div>
        )}
      </div>

      {/* Konfigurasi Target Spreadsheet ID & Web App Live Connection */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Konfigurasi Target Google Spreadsheet & Web App Sekolah
              </h3>
              <p className="text-slate-500 text-xs">
                Ganti ID Spreadsheet dan URL Web App untuk menghubungkan aplikasi ke Google Spreadsheet sekolah Anda sendiri.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-300"
              title="Kembalikan ke Spreadsheet ID bawaan SMKN 1 Batumandi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConnection}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan & Terapkan Koneksi</span>
            </button>
          </div>
        </div>

        {saveFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Field 1: Target Spreadsheet ID / URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Target Google Spreadsheet ID:</span>
              </label>
              <span className="text-[10px] text-slate-400">Bisa paste URL Spreadsheet langsung</span>
            </div>
            <input
              type="text"
              value={spreadsheetIdInput}
              onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
              placeholder="Contoh: 1lQ4BNn0l9Qjp06g-QSOilD1I8-2nX4pK7a4qbRv34OI atau paste link Docs"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Status Aktif:{' '}
                <b className="font-mono text-slate-800 font-bold">
                  {settings.spreadsheetId === activeSpreadsheetId ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Tersimpan & Aktif
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Belum disimpan (klik Simpan)
                    </span>
                  )}
                </b>
              </span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Buka Spreadsheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Field 2: Web App Deployment URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Link className="w-4 h-4 text-blue-600" />
                <span>URL Web App Google Apps Script (Live Sync API):</span>
              </label>
              <span className="text-[10px] text-slate-400">Diperoleh dari Deploy Web App</span>
            </div>
            <input
              type="text"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-500">
              Digunakan aplikasi untuk tarik/kirim data otomatis, auto-fill nomor surat bolong, dan verifikasi.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span>Petunjuk Pemasangan di Sekolah Baru:</span>
          </p>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            1. Buat Spreadsheet Google baru di akun Google sekolah Anda &rarr; 2. Salin Spreadsheet ID atau URL-nya lalu tempelkan pada kolom di atas &rarr; 3. Klik <b>Simpan & Terapkan Koneksi</b> &rarr; 4. Kode Apps Script di bawah otomatis diperbarui dengan ID baru sekolah Anda. Salin dan pasang ke <i>Apps Script</i> &rarr; 5. Deploy sebagai Web App dan tempelkan URL Web App ke kolom di atas.
          </p>
        </div>
      </div>

      {/* Code.gs Script Generator & Setup Tutorial */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Backend Code Generator</span>
            <h3 className="text-lg font-extrabold text-slate-900">Kode Generator Code.gs Google Apps Script</h3>
            <p className="text-xs text-slate-500">
              Kode ini otomatis mengkonfigurasi 12 sheet database, REST API endpoints, <b>Opsi B Auto-Fill Nomor Bolong</b>, dan <b>LockService</b> (anti nomor kembar/ganda).
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="bg-slate-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
            <span>{copied ? 'Kode Tersalin!' : 'Salin Semua Kode.gs'}</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
          <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Langkah Pemasangan / Pembaruan di Google Apps Script:</span>
          </h4>
          <ol className="list-decimal list-inside space-y-1 font-medium leading-relaxed">
            <li>
              Buka Spreadsheet target ID:{' '}
              <b className="font-mono text-blue-900 bg-blue-100/70 px-1.5 py-0.5 rounded">
                {activeSpreadsheetId || 'MASUKKAN_SPREADSHEET_ID_ANDA'}
              </b>
              .
            </li>
            <li>Klik menu <b>Ekstensi (Extensions)</b> → <b>Apps Script</b>.</li>
            <li>Hapus seluruh kode lama di `Code.gs`, lalu <b>Paste</b> kode dari tombol di atas.</li>
            <li>Pilih fungsi <b className="font-mono text-blue-900">bootstrapSheets</b> lalu klik <b>Run (Jalankan)</b> untuk otomatis membuat sheet `MasterKelas` dan `MasterJurusan`.</li>
            <li>Klik <b>Deploy</b> → <b>Kelola Deployment (Manage Deployments)</b> → Klik ikon Pensil (Edit) → Pilih <b>New version</b> → Klik <b>Deploy</b>.</li>
          </ol>
        </div>

        {/* Live Code Box */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
          <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
            <code>{generatedCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
