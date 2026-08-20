import React, { useState } from 'react';
import { User, SchoolSettings, SubmissionRequest, ComplaintTicket } from '../../types';
import {
  LayoutDashboard,
  FileText,
  Layers,
  History,
  Users,
  Database,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Bell,
  MessageSquare
} from 'lucide-react';

interface AdminLayoutProps {
  currentUser: User;
  settings: SchoolSettings;
  submissions?: SubmissionRequest[];
  complaints?: ComplaintTicket[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  settings,
  submissions = [],
  complaints = [],
  activeTab,
  setActiveTab,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const pendingCount = submissions.filter((s) => s.status === 'Menunggu').length;
  const newComplaintsCount = complaints.filter((c) => c.status === 'Baru').length;

  const navItems = [
    { id: 'admin-dashboard', label: 'Dashboard SaaS', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'permohonan',
      label: 'Data Permohonan Surat',
      icon: <FileText className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'jenis-surat', label: 'Jenis Surat & Form Builder', icon: <Layers className="w-4 h-4" /> },
    { id: 'log-audit', label: 'Log Aktivitas & Audit', icon: <History className="w-4 h-4" /> },
    {
      id: 'pengaduan',
      label: 'Pesan & Pengaduan',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: newComplaintsCount > 0 ? newComplaintsCount : null,
      badgeColor: 'bg-amber-400 text-slate-950',
    },
    { id: 'pengguna', label: 'Pengguna & Hak Akses', icon: <Users className="w-4 h-4" />, roleReq: 'super_admin' },
    { id: 'sync-spreadsheet', label: 'Sync Google Spreadsheet', icon: <Database className="w-4 h-4" /> },
    { id: 'pengaturan', label: 'Setting Sekolah', icon: <Settings className="w-4 h-4" />, roleReq: 'super_admin' },
  ];

  const filteredNav = navItems.filter((item) => {
    if (!item.roleReq) return true;
    return currentUser.role === 'super_admin';
  });


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Top bar */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm text-blue-400">PANEL ADMIN TU</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 flex flex-col justify-between transition-all duration-300 transform overflow-hidden ${
          mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        } ${
          sidebarOpen ? 'lg:translate-x-0 lg:w-64 lg:flex' : 'lg:-translate-x-full lg:w-0 lg:hidden'
        }`}
      >
        <div className="space-y-6 p-5">
          {/* Logo Identity */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center font-bold text-white text-base shadow-md shrink-0 overflow-hidden">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                'TU'
              )}
            </div>
            <div>
              <h2 className="font-bold text-white text-sm line-clamp-1">{settings.schoolName}</h2>
              <p className="text-[11px] text-blue-400 font-medium">Portal Administrator</p>
            </div>
          </div>

          {/* User Badge */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-xl object-cover border border-blue-400"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-xs truncate">{currentUser.name}</h4>
              <span className="bg-blue-900 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1 text-xs font-semibold">
            {filteredNav.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`${item.badgeColor || 'bg-rose-500 text-white'} text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setActiveTab('beranda')}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Ke Halaman Publik</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title={sidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 capitalize">
              {activeTab.replace('admin-', '').replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-600 border border-slate-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Spreadsheet ID: <b className="font-mono text-slate-800">{settings.spreadsheetId.slice(0, 10)}...</b>
              </span>
            </div>

            <button
              onClick={() => setActiveTab('permohonan')}
              className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
              title="Notifikasi Permohonan"
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>
          </div>
        </header>

        {/* Page Container */}
        <div className="p-6 sm:p-8 space-y-8">{children}</div>
      </main>
    </div>
  );
};
