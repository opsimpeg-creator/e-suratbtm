import React from 'react';
import { SubmissionRequest, LetterType, SchoolSettings } from '../../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FilePlus,
  Layers,
  Database,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  submissions: SubmissionRequest[];
  letterTypes: LetterType[];
  settings: SchoolSettings;
  setAdminTab: (tab: string, filterStatus?: string) => void;
  onSelectRequestDetail: (req: SubmissionRequest) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  submissions,
  letterTypes,
  settings,
  setAdminTab,
  onSelectRequestDetail,
}) => {
  const total = submissions.length;
  const selesai = submissions.filter((s) => s.status === 'Selesai').length;
  const diproses = submissions.filter((s) => s.status === 'Diproses').length;
  const ditolak = submissions.filter((s) => s.status === 'Ditolak').length;
  const menunggu = submissions.filter((s) => s.status === 'Menunggu').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const hariIni = submissions.filter((s) => s.createdAt && s.createdAt.startsWith(todayStr)).length;

  // Real Monthly Distribution Calculation for Current Year
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentYear = new Date().getFullYear();

  const monthlyData = monthNames.map((month, idx) => {
    const count = submissions.filter((s) => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;
    return { month, val: count };
  });

  const maxVal = Math.max(...monthlyData.map((d) => d.val), 5);

  // Real Applicant Role Ratios
  const siswaCount = submissions.filter((s) => s.applicantRole === 'siswa').length;
  const alumniCount = submissions.filter((s) => s.applicantRole === 'alumni').length;
  const ortuCount = submissions.filter((s) => s.applicantRole === 'orang_tua' || s.applicantRole === 'lainnya').length;

  const siswaPct = total > 0 ? Math.round((siswaCount / total) * 100) : 0;
  const alumniPct = total > 0 ? Math.round((alumniCount / total) * 100) : 0;
  const ortuPct = total > 0 ? Math.max(0, 100 - siswaPct - alumniPct) : 0;

  // Real Letter Type Breakdown
  const letterTypeStats = letterTypes.map((lt) => {
    const count = submissions.filter((s) => s.letterTypeId === lt.id || s.letterTypeName === lt.name).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      id: lt.id,
      code: lt.code,
      name: lt.name,
      count,
      pct,
    };
  }).sort((a, b) => b.count - a.count);

  // Recent Submissions Sorted by Date Descending
  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-800/80 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Sistem Tata Usaha Terintegrasi Google Spreadsheet</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Layanan E-Surat TU
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Pantau permohonan surat siswa & alumni, verifikasi ijazah, kelola template resmi, dan sinkronkan data secara real-time.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-2xl text-xs text-blue-100 shrink-0">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-semibold">{settings.schoolName || 'SMK Negeri 1 Batumandi'}</span>
        </div>
      </div>

      {/* 5 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total */}
        <div
          onClick={() => setAdminTab('permohonan', 'all')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer space-y-3 group"
          title="Klik untuk melihat semua permohonan"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-blue-600 transition">Total Permohonan</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900">{total}</h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Activity className="w-3 h-3" /> Real-time
            </span>
          </div>
        </div>

        {/* Card 2: Menunggu */}
        <div
          onClick={() => setAdminTab('permohonan', 'Menunggu')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition cursor-pointer space-y-3 group"
          title="Klik untuk melihat permohonan yang berstatus Menunggu"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-amber-600 transition">Permohonan Menunggu</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:bg-amber-500 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-amber-700">{menunggu}</h3>
            <span className="text-[11px] text-amber-600 font-semibold">{hariIni} baru hari ini</span>
          </div>
        </div>

        {/* Card 3: Selesai */}
        <div
          onClick={() => setAdminTab('permohonan', 'Selesai')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition cursor-pointer space-y-3 group"
          title="Klik untuk melihat surat yang sudah Selesai"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-emerald-600 transition">Surat Selesai</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-emerald-700">{selesai}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Terbit ({total ? Math.round((selesai/total)*100) : 0}%)</span>
          </div>
        </div>

        {/* Card 4: Diproses */}
        <div
          onClick={() => setAdminTab('permohonan', 'Diproses')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition cursor-pointer space-y-3 group"
          title="Klik untuk melihat surat yang Sedang Diproses"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-indigo-600 transition">Sedang Diproses</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-indigo-700">{diproses}</h3>
            <span className="text-[11px] text-indigo-600 font-semibold">Verifikasi</span>
          </div>
        </div>

        {/* Card 5: Ditolak */}
        <div
          onClick={() => setAdminTab('permohonan', 'Ditolak')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition cursor-pointer space-y-3 group"
          title="Klik untuk melihat surat yang Ditolak"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-rose-600 transition">Surat Ditolak</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold group-hover:bg-rose-600 group-hover:text-white transition">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-rose-700">{ditolak}</h3>
            <span className="text-[11px] text-rose-600 font-semibold">Tidak Valid</span>
          </div>
        </div>
      </div>

      {/* Visual Charts & Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend Bar Chart (Real Database Calculation) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-base">Grafik Permohonan Real-time Bulanan</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Tahun {currentYear}</span>
          </div>

          {/* Custom SVG/HTML Bar Chart driven by real database data */}
          <div className="h-48 flex items-end justify-between gap-1.5 pt-8 px-2 border-b border-slate-200">
            {monthlyData.map((d, i) => {
              const heightPercent = d.val > 0 ? Math.max(12, Math.round((d.val / maxVal) * 100)) : 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className={`text-[10px] font-bold ${d.val > 0 ? 'text-blue-700' : 'text-slate-300'} group-hover:opacity-100 transition`}>
                    {d.val}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all ${
                      d.val > 0
                        ? 'bg-gradient-to-t from-blue-700 to-indigo-500 group-hover:from-blue-600 group-hover:to-indigo-400'
                        : 'bg-slate-100 group-hover:bg-slate-200'
                    }`}
                  ></div>
                  <span className="text-[11px] font-semibold text-slate-500">{d.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-around gap-2 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <span>Siswa ({siswaCount} - {siswaPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span>Alumni ({alumniCount} - {alumniPct}%)</span>
            </div>
            {ortuCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Orang Tua/Lainnya ({ortuCount} - {ortuPct}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-base">Distribusi Status Surat</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div
              onClick={() => setAdminTab('permohonan', 'Selesai')}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 cursor-pointer transition"
              title="Klik untuk memfilter status Selesai"
            >
              <span className="font-bold text-emerald-900">Selesai / Terbit</span>
              <span className="font-extrabold text-emerald-700 text-sm">{selesai} ({total ? Math.round((selesai/total)*100) : 0}%)</span>
            </div>

            <div
              onClick={() => setAdminTab('permohonan', 'Diproses')}
              className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 cursor-pointer transition"
              title="Klik untuk memfilter status Diproses"
            >
              <span className="font-bold text-blue-900">Sedang Diproses</span>
              <span className="font-extrabold text-blue-700 text-sm">{diproses} ({total ? Math.round((diproses/total)*100) : 0}%)</span>
            </div>

            <div
              onClick={() => setAdminTab('permohonan', 'Menunggu')}
              className="flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 cursor-pointer transition"
              title="Klik untuk memfilter status Menunggu"
            >
              <span className="font-bold text-amber-900">Menunggu Verifikasi</span>
              <span className="font-extrabold text-amber-700 text-sm">{menunggu} ({total ? Math.round((menunggu/total)*100) : 0}%)</span>
            </div>

            <div
              onClick={() => setAdminTab('permohonan', 'Ditolak')}
              className="flex items-center justify-between p-3 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 cursor-pointer transition"
              title="Klik untuk memfilter status Ditolak"
            >
              <span className="font-bold text-rose-900">Ditolak / Revisi</span>
              <span className="font-extrabold text-rose-700 text-sm">{ditolak} ({total ? Math.round((ditolak/total)*100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Breakdown per Jenis Surat */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-slate-900 text-base">Statistik Permohonan Berdasarkan Jenis Surat</h3>
          </div>
          <span className="text-xs text-slate-500">{letterTypes.length} Jenis Surat Aktif</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {letterTypeStats.map((item) => (
            <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md">
                    {item.code}
                  </span>
                  <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-extrabold text-slate-900 text-base">{item.count}</span>
                <p className="text-[10px] text-slate-500 font-semibold">{item.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Submissions List & Quick Actions */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-base">Permohonan Terbaru Masuk</h3>
          </div>

          <button
            onClick={() => setAdminTab('permohonan')}
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Permohonan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {recentSubmissions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Belum ada data permohonan surat.</p>
          ) : (
            recentSubmissions.map((req) => (
              <div
                key={req.id}
                onClick={() => {
                  setAdminTab('permohonan');
                  onSelectRequestDetail(req);
                }}
                className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50 px-3 rounded-xl cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {req.letterTypeName ? req.letterTypeName.substring(0, 2).toUpperCase() : 'SR'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{req.applicantName}</h4>
                    <p className="text-xs text-slate-500">
                      {req.letterTypeName} • <span className="font-mono text-slate-700">{req.requestNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400 hidden sm:inline">
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('id-ID') : '-'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                      req.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'Diproses'
                        ? 'bg-blue-100 text-blue-800'
                        : req.status === 'Ditolak'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
