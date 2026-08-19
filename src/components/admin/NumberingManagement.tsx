import React, { useState } from 'react';
import { SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { Hash, Save, RefreshCw, Check, Sparkles } from 'lucide-react';

interface NumberingManagementProps {
  settings: SchoolSettings;
  onRefresh: () => void;
}

export const NumberingManagement: React.FC<NumberingManagementProps> = ({ settings, onRefresh }) => {
  const [pattern, setPattern] = useState(settings.letterNumberPattern || '420/{SEQ}/TU-SMK/{YEAR}');
  const [seqNumber, setSeqNumber] = useState(settings.currentSeqNumber || 1);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      letterNumberPattern: pattern,
      currentSeqNumber: seqNumber,
    };
    StorageService.saveSettings(updated);
    onRefresh();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const sampleSeq = String(seqNumber).padStart(3, '0');

  const previewNumber = pattern
    .replace('{SEQ}', sampleSeq)
    .replace('{YEAR}', String(currentYear))
    .replace('{MONTH}', currentMonth);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Fitur Penomoran Otomatis</span>
        <h2 className="text-xl font-extrabold text-slate-900">Konfigurasi Format Nomor Surat Resmi</h2>
        <p className="text-xs text-slate-500">
          Atur pola penomoran otomatis yang bertambah secara berurutan dan reset tiap awal tahun ajaran.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Format penomoran berhasil disimpan!</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">Pola Format Nomor Surat *</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="420/{SEQ}/TU-SMK/{YEAR}"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-blue-900"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Gunakan tag: <b className="font-mono">{'{SEQ}'}</b> untuk nomor urut, <b className="font-mono">{'{YEAR}'}</b> untuk tahun, <b className="font-mono">{'{MONTH}'}</b> untuk bulan.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Nomor Urut Saat Ini (Counter Sequence) *</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={seqNumber}
                onChange={(e) => setSeqNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                required
              />
              <button
                type="button"
                onClick={() => setSeqNumber(1)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 flex items-center gap-1 whitespace-nowrap"
                title="Reset Counter Ke 1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset 1</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Format Penomoran</span>
            </button>
          </div>
        </form>

        {/* Live Preview Box */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Pratinjau Nomor Surat Berikutnya</h3>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-2 text-center">
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                NOMOR SURAT OTOMATIS BERIKUTNYA
              </span>
              <p className="text-2xl font-extrabold text-amber-300 font-mono tracking-wider">
                {previewNumber}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
            <p className="font-bold text-white">Catatan Sistem Penomoran:</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Setiap kali Staf TU menyetujui dan menerbitkan surat resmi baru, nomor urut sequence akan bertambah +1 secara otomatis di database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
