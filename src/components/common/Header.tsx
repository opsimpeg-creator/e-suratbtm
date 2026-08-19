import React from 'react';
import { FileText, Search, ShieldCheck, Info, Phone, Lock, User as UserIcon, LogOut, LayoutDashboard, Moon, Clock } from 'lucide-react';
import { SchoolSettings, User } from '../../types';

interface HeaderProps {
  settings: SchoolSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenSubmitModal: (letterTypeId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenSubmitModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4 text-blue-100">
            {settings.operatingHours?.isRamadanMode ? (
              <span className="bg-amber-500/20 text-amber-200 border border-amber-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <Moon className="w-3.5 h-3.5 text-amber-300" />
                <span>Jam Layanan Ramadhan: <b>{settings.operatingHours.ramadanHours}</b></span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>Jam Layanan TU: <b>Sen-Kam ({settings.operatingHours?.monThuHours || '08.00 - 15.00 WITA'}) | Jum ({settings.operatingHours?.friHours || '08.00 - 11.30 WITA'})</b></span>
              </span>
            )}
            <span className="hidden md:inline text-blue-300/40">|</span>
            <span className="hidden md:inline"> Email: {settings.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${settings.waAdminNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-amber-300 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Bantuan WA Staf TU</span>
            </a>
            {currentUser ? (
              <div className="flex items-center gap-2 bg-blue-950/60 px-2.5 py-0.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium text-blue-200">{currentUser.name} ({currentUser.role})</span>
                <button
                  onClick={onLogout}
                  className="hover:text-red-300 ml-1 p-0.5"
                  title="Logout Admin"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-0.5 rounded-md text-xs transition"
              >
                <Lock className="w-3 h-3" />
                <span>Portal Login Staff TU</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('beranda')}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-1.5 shadow-xs group-hover:scale-105 transition-transform">
              <img
                src={settings.logoUrl}
                alt="Logo Sekolah"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <FileText className="w-7 h-7 text-blue-800 fallback-icon hidden" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition">
                  {settings.schoolName}
                </h1>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  E-SURAT TU
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                Layanan Persuratan Online Siswa & Alumni Integrated System
              </p>
            </div>
          </div>

          {/* Nav Items (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('beranda')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'beranda'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Beranda</span>
            </button>

            <button
              onClick={() => setActiveTab('cek-status')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'cek-status'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Cek Status Surat</span>
            </button>

            <button
              onClick={() => setActiveTab('verifikasi')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'verifikasi'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verifikasi QR</span>
            </button>

            <button
              onClick={() => setActiveTab('informasi')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'informasi'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Informasi</span>
            </button>

            <button
              onClick={() => setActiveTab('kontak')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'kontak'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Kontak</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onOpenSubmitModal()}
              className="flex items-center gap-1.5 sm:gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <span>+ Ajukan Surat</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Panel Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center justify-around border-t border-slate-100 py-2.5 text-xs font-semibold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('beranda')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'beranda' ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
          >
            Beranda
          </button>
          <button
            onClick={() => setActiveTab('cek-status')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'cek-status' ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
          >
            Cek Status
          </button>
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'verifikasi' ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
          >
            Verifikasi
          </button>
          <button
            onClick={() => setActiveTab('informasi')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'informasi' ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('kontak')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'kontak' ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
          >
            Kontak
          </button>
        </div>
      </div>
    </header>
  );
};
