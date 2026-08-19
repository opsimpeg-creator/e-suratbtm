import React from 'react';
import { SchoolSettings } from '../../types';
import { FileText, MapPin, Phone, Mail, ShieldCheck, ExternalLink, Moon } from 'lucide-react';

interface FooterProps {
  settings: SchoolSettings;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, setActiveTab, onOpenLogin }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: Identity */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                TU
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-snug">{settings.schoolName}</h3>
                <p className="text-xs text-blue-400 font-medium">Pelayanan Persuratan Tata Usaha</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem Pelayanan Persuratan Siswa dan Alumni berbasis Digital secara Cepat, Transparan, Akuntabel, dan Bebas Biaya (Gratis).
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Spreadsheet Database Sync Connected</span>
            </div>
          </div>

          {/* Col 2: Nav Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 border-l-2 border-blue-500 pl-2">Layanan Utama</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('beranda')}
                  className="hover:text-blue-400 transition"
                >
                  Beranda & Katalog Surat
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('cek-status')}
                  className="hover:text-blue-400 transition"
                >
                  Cek Status Permohonan
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('verifikasi')}
                  className="hover:text-blue-400 transition flex items-center gap-1 text-emerald-400 font-semibold"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verifikasi Keabsahan QR Code</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('informasi')}
                  className="hover:text-blue-400 transition"
                >
                  Petunjuk & Syarat Dokumen
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Info */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 border-l-2 border-blue-500 pl-2">Kontak Loket TU</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{settings.email}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Operational & Portal Admin */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm mb-2 border-l-2 border-blue-500 pl-2">Jam Kerja Loket TU</h4>
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 text-xs space-y-1.5">
              {settings.operatingHours?.isRamadanMode ? (
                <>
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold border-b border-slate-700 pb-1 text-[11px]">
                    <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Mode Bulan Ramadhan</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1">
                    <span className="text-slate-300">Senin - Jumat</span>
                    <span className="text-amber-300 font-bold">{settings.operatingHours.ramadanHours}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">Senin - Kamis</span>
                    <span className="text-blue-400 font-bold">{settings.operatingHours?.monThuHours || '08.00 - 15.00 WITA'}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">Jumat</span>
                    <span className="text-indigo-400 font-bold">{settings.operatingHours?.friHours || '08.00 - 11.30 WITA'}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-medium pt-1 border-t border-slate-700/60 text-[11px] text-slate-400">
                <span>Sabtu - Minggu</span>
                <span>Tutup / Libur</span>
              </div>
            </div>

            <button
              onClick={onOpenLogin}
              className="w-full text-center py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <span>Login Internal Staf Tata Usaha</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Tata Usaha {settings.schoolName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setActiveTab('informasi')}>Privasi & Keamanan</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setActiveTab('kontak')}>Bantuan Teknikal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
