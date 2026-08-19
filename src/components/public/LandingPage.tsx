import React, { useState } from 'react';
import { LetterType, SchoolSettings, SubmissionRequest } from '../../types';
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
  FilePlus,
  QrCode,
  GraduationCap,
  Award,
  Briefcase,
  BookOpen,
  Send
} from 'lucide-react';

interface LandingPageProps {
  settings: SchoolSettings;
  letterTypes: LetterType[];
  submissions: SubmissionRequest[];
  onSelectLetterType: (type: LetterType) => void;
  onTrackNumber: (number: string) => void;
  setActiveTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  settings,
  letterTypes,
  submissions,
  onSelectLetterType,
  onTrackNumber,
  setActiveTab,
}) => {
  const [trackInput, setTrackInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTypes = letterTypes.filter((t) => t.active).sort((a, b) => a.order - b.order);
  const filteredTypes = activeTypes.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSelesai = submissions.filter((s) => s.status === 'Selesai').length + 142; // baseline counter

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onTrackNumber(trackInput.trim());
      setActiveTab('cek-status');
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6" />;
      case 'Award':
        return <Award className="w-6 h-6" />;
      case 'Briefcase':
        return <Briefcase className="w-6 h-6" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white pt-14 pb-20 rounded-b-3xl shadow-xl">
        {/* Subtle Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-700/60 backdrop-blur-md border border-blue-500/40 text-blue-100 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Layanan Mandiri Tata Usaha Digital {settings.schoolName}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Layanan Pengajuan <br />
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent">
                  Surat Siswa & Alumni
                </span>{' '}
                Online
              </h1>

              <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
                Ajukan Surat Keterangan Aktif Sekolah, Surat Alumni, Rekomendasi, PKL, dan Izin secara cepat, transparan, serta dapat diverifikasi langsung melalui QR Code keabsahan resmi.
              </p>

              {/* Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-2">
                <a
                  href="#katalog-surat"
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                >
                  <FilePlus className="w-5 h-5 text-blue-900" />
                  <span>Pilih Jenis Surat</span>
                </a>

                <button
                  onClick={() => setActiveTab('cek-status')}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Search className="w-5 h-5 text-blue-200" />
                  <span>Cek Status Permohonan</span>
                </button>
              </div>

              {/* Statistics Chips */}
              <div className="pt-6 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 border-t border-blue-700/50">
                <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-700/40">
                  <p className="text-xl sm:text-2xl font-bold text-amber-300">{activeTypes.length}</p>
                  <p className="text-[11px] text-blue-200">Jenis Surat Aktif</p>
                </div>
                <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-700/40">
                  <p className="text-xl sm:text-2xl font-bold text-emerald-300">1 - 2 Hari</p>
                  <p className="text-[11px] text-blue-200">Rata-rata Proses</p>
                </div>
                <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-700/40">
                  <p className="text-xl sm:text-2xl font-bold text-sky-300">{totalSelesai}+</p>
                  <p className="text-[11px] text-blue-200">Surat Diterbitkan</p>
                </div>
              </div>
            </div>

            {/* Right Card: Quick Track Search Box */}
            <div className="lg:col-span-5">
              <div className="bg-white/95 backdrop-blur-xl text-slate-900 p-6 sm:p-7 rounded-2xl shadow-2xl border border-white/20 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Lacak Permohonan Surat</h3>
                    <p className="text-xs text-slate-500">Masukkan Nomor Permohonan / Resi Anda</p>
                  </div>
                </div>

                <form onSubmit={handleTrackSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Permohonan (Contoh: SRT-202608-0001)
                    </label>
                    <input
                      type="text"
                      value={trackInput}
                      onChange={(e) => setTrackInput(e.target.value)}
                      placeholder="Ketik SRT-202608-XXXX..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase font-mono tracking-wider"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Cek Status Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Bebas Biaya (Gratis)
                  </span>
                  <button
                    onClick={() => setActiveTab('verifikasi')}
                    className="text-blue-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Verifikasi QR Surat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section (Dynamic Letter Types List from DB) */}
      <section id="katalog-surat" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Katalog Layanan Publik</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pilih Jenis Surat yang Ingin Diajukan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Formulir akan menyesuaikan secara otomatis sesuai konfigurasi data jenis surat.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari jenis surat..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Cards Grid */}
        {filteredTypes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">Jenis Surat Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-md ${type.color || 'bg-blue-600'}`}>
                      {getIconComponent(type.iconName)}
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                      Kode: {type.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {type.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Est. {type.processingTimeDays} Hari Kerja</span>
                  </div>

                  <button
                    onClick={() => onSelectLetterType(type)}
                    className="bg-blue-50 hover:bg-blue-700 text-blue-700 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>Buat Permohonan</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Procedure Workflow Section */}
      <section className="bg-slate-900 text-white py-16 rounded-3xl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            Alur Pelayanan Tata Usaha
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            4 Langkah Mudah Mengajukan Surat
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Proses pengajuan surat dilakukan secara serba otomatis, cepat, dan transparan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
              01
            </div>
            <h3 className="font-bold text-base text-white">Pilih Jenis Surat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih jenis dokumen surat resmi yang Anda perlukan melalui katalog surat publik di atas.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
              02
            </div>
            <h3 className="font-bold text-base text-white">Isi Form & Lampiran</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lengkapi isian data diri (NIS/NISN/Kelas/Jurusan) serta unggah lampiran jika diperlukan.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
              03
            </div>
            <h3 className="font-bold text-base text-white">Verifikasi Staf TU</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Staf Tata Usaha memverifikasi data dengan Dapodik sekolah dan menerbitkan Nomor Surat Resmi.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
              04
            </div>
            <h3 className="font-bold text-base text-white">Unduh PDF / Scan QR</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unduh hasil surat berstempel dan bertanda tangan digital serta verifikasi keaslian via QR Code.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
