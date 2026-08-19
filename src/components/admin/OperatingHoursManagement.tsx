import React, { useState } from 'react';
import { SchoolSettings, OperatingHours } from '../../types';
import { StorageService } from '../../services/storage';
import { Clock, Moon, Sun, Calendar, Save, Check, Info, Sparkles } from 'lucide-react';

interface OperatingHoursManagementProps {
  settings: SchoolSettings;
  onRefresh: () => void;
}

export const OperatingHoursManagement: React.FC<OperatingHoursManagementProps> = ({
  settings,
  onRefresh,
}) => {
  const defaultHours: OperatingHours = {
    isRamadanMode: false,
    monThuHours: '08.00 - 15.00 WITA',
    friHours: '08.00 - 11.30 WITA',
    ramadanHours: '08.00 - 13.00 WITA',
    ramadanNote: 'Khusus Selama Bulan Suci Ramadhan',
    generalNote: 'Sabtu, Minggu & Hari Libur Nasional Tutup',
  };

  const [hours, setHours] = useState<OperatingHours>(
    settings.operatingHours || defaultHours
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleRamadan = () => {
    const updated = { ...hours, isRamadanMode: !hours.isRamadanMode };
    setHours(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: SchoolSettings = {
      ...settings,
      operatingHours: hours,
    };
    StorageService.saveSettings(updatedSettings);
    StorageService.addAuditLog(
      'super_admin',
      'UBAH_JAM_KERJA',
      `Mengubah jam kerja pelayanan TU (Mode Ramadhan: ${hours.isRamadanMode ? 'Aktif' : 'Non-Aktif'})`
    );
    onRefresh();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-xs">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-700" />
            <h2 className="text-xl font-extrabold text-slate-900">
              Pengaturan Jam Kerja Loket Tata Usaha
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur jadwal resmi pelayanan fisik/online loket TU untuk hari biasa (Senin–Kamis & Jumat) serta penyesuaian khusus Bulan Suci Ramadhan.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Jam kerja berhasil disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Ramadan Mode Toggle Box */}
        <div className={`p-5 rounded-2xl border transition-all ${
          hours.isRamadanMode
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-amber-300'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-2xl shrink-0 ${
                hours.isRamadanMode ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-200 text-slate-600'
              }`}>
                {hours.isRamadanMode ? <Moon className="w-6 h-6 animate-bounce" /> : <Sun className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    Mode Jam Kerja Bulan Ramadhan
                  </span>
                  {hours.isRamadanMode ? (
                    <span className="bg-amber-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AKTIF
                    </span>
                  ) : (
                    <span className="bg-slate-300 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      NON-AKTIF (HARI BIASA)
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Aktifkan switch ini saat memasuki Bulan Puasa / Ramadhan agar jam kerja loket otomatis disesuaikan dan ditampilkan dengan badge khusus di landing page.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleRamadan}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm shrink-0 flex items-center gap-2 ${
                hours.isRamadanMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              {hours.isRamadanMode ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Matikan Mode Ramadhan</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-600" />
                  <span>Aktifkan Mode Ramadhan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Operational Schedule Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Schedule 1: Senin - Kamis */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Senin - Kamis (Hari Biasa)</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Jam Pelayanan Loket
              </label>
              <input
                type="text"
                value={hours.monThuHours}
                onChange={(e) => setHours({ ...hours, monThuHours: e.target.value })}
                placeholder="08.00 - 15.00 WITA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">Jam pelayanan Senin s.d. Kamis pada kondisi kerja normal.</p>
          </div>

          {/* Schedule 2: Jumat */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-indigo-700" />
              <span>Jumat (Hari Biasa)</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Jam Pelayanan Loket
              </label>
              <input
                type="text"
                value={hours.friHours}
                onChange={(e) => setHours({ ...hours, friHours: e.target.value })}
                placeholder="08.00 - 11.30 WITA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">Jam pelayanan hari Jumat menyesuaikan waktu Ibadah Salat Jumat.</p>
          </div>

          {/* Schedule 3: Ramadhan */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs border-b border-amber-200/60 pb-2">
              <Moon className="w-4 h-4 text-amber-600" />
              <span>Khusus Bulan Ramadhan</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">
                Jam Pelayanan Ramadhan
              </label>
              <input
                type="text"
                value={hours.ramadanHours}
                onChange={(e) => setHours({ ...hours, ramadanHours: e.target.value })}
                placeholder="08.00 - 13.00 WITA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-amber-700 font-medium">Jam pelayanan khusus selama Bulan Suci Ramadhan.</p>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Umum (Libur / Weekend)
            </label>
            <input
              type="text"
              value={hours.generalNote || ''}
              onChange={(e) => setHours({ ...hours, generalNote: e.target.value })}
              placeholder="Sabtu, Minggu & Hari Libur Nasional Tutup"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Pengumuman Ramadhan
            </label>
            <input
              type="text"
              value={hours.ramadanNote || ''}
              onChange={(e) => setHours({ ...hours, ramadanNote: e.target.value })}
              placeholder="Khusus Selama Bulan Suci Ramadhan"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Pratinjau Tampilan Jam Kerja di Landing Page:</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700/80 space-y-2">
            {hours.isRamadanMode ? (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full font-bold text-xs">
                  <Moon className="w-3.5 h-3.5" />
                  <span>JADWAL RAMADHAN: Senin - Jumat ({hours.ramadanHours})</span>
                </div>
                <p className="text-[11px] text-amber-200/80 italic pl-1">
                  *{hours.ramadanNote || 'Khusus Bulan Ramadhan'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Senin - Kamis:</span>
                  <span className="font-extrabold text-blue-400 text-sm">{hours.monThuHours}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Jumat:</span>
                  <span className="font-extrabold text-indigo-400 text-sm">{hours.friHours}</span>
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-2">
              Keterangan Tambahan: <span className="text-slate-200 font-medium">{hours.generalNote || 'Sabtu - Minggu & Hari Libur Nasional Tutup'}</span>
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Jam Kerja Loket TU</span>
          </button>
        </div>
      </form>
    </div>
  );
};
