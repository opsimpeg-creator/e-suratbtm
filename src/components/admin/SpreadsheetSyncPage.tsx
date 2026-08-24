import React, { useState } from 'react';
import { SchoolSettings } from '../../types';
import { AppsScriptService } from '../../services/appsScript';
import { StorageService } from '../../services/storage';
import { Database, ExternalLink, Copy, Check, RefreshCw, Code, Sparkles, ShieldCheck, GraduationCap, BookOpen, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface SpreadsheetSyncPageProps {
  settings: SchoolSettings;
  onRefresh: () => void;
}

export const SpreadsheetSyncPage: React.FC<SpreadsheetSyncPageProps> = ({ settings, onRefresh }) => {
  const [copied, setCopied] = useState(false);
  const [webAppUrl, setWebAppUrl] = useState(settings.webAppUrl || settings.appsScriptWebAppUrl || '');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const generatedCode = AppsScriptService.generateAppsScriptCode(settings.spreadsheetId);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWebAppUrl = () => {
    StorageService.saveSettings({
      ...settings,
      webAppUrl: webAppUrl.trim(),
      appsScriptWebAppUrl: webAppUrl.trim(),
    });
    onRefresh();
    alert('URL Web App Google Apps Script berhasil disimpan!');
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-extrabold text-white">Integrasi Direct Google Spreadsheet Database</h2>
        </div>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Aplikasi ini dirancang <b>Spreadsheet-First</b>. Seluruh data permohonan, pengaduan, template surat, serta <b>Master Referensi Kelas & Jurusan</b> tersinkronisasi langsung dengan Google Spreadsheet.
        </p>

        {/* Master Data Snapshot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
                <p className="text-sm font-extrabold text-white">{settings.majors?.length || 0} Jurusan / Konsentrasi</p>
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

      {/* Web App URL Connection Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
          URL Web App Google Apps Script (Live Sync Production)
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs"
          />
          <button
            onClick={handleSaveWebAppUrl}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl whitespace-nowrap"
          >
            Simpan Web App URL
          </button>
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
            <li>Buka Spreadsheet target ID: <b className="font-mono">{settings.spreadsheetId}</b>.</li>
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
