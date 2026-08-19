import React, { useState } from 'react';
import { SchoolSettings, ComplaintTicket } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  MessageSquare,
  Send,
  Clock,
  Moon,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface ContactPageProps {
  settings: SchoolSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  // Mode: 'create' for Kirim Pesan, 'track' for Lacak Pengaduan
  const [activeMode, setActiveMode] = useState<'create' | 'track'>('create');

  // Form State for creating new complaint
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [category, setCategory] = useState('Kendala Permohonan Surat');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<ComplaintTicket | null>(null);

  // Tracking State
  const [searchTicketNumber, setSearchTicketNumber] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<ComplaintTicket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const handleCopyTicket = (ticketNum: string) => {
    navigator.clipboard.writeText(ticketNum);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderContact.trim() || !message.trim()) {
      alert('Mohon lengkapi Nama, Kontak, dan Isi Pesan.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create complaint ticket in Storage & Firebase
      const ticket = StorageService.createComplaint({
        senderName,
        senderContact,
        category,
        message,
      });

      // 2. Sync to Google Apps Script / Spreadsheet in background
      AppsScriptService.sendComplaintToAppsScript(ticket).catch((err) => {
        console.warn('Sync complaint to Apps Script:', err);
      });

      setCreatedTicket(ticket);
      setSenderName('');
      setSenderContact('');
      setMessage('');
    } catch (err: any) {
      alert('Gagal mengirim pengaduan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNum = searchTicketNumber.trim();
    if (!cleanNum) {
      alert('Masukkan nomor tiket pengaduan Anda (contoh: TKT-202608-0001)');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    setTimeout(() => {
      const found = StorageService.getComplaintByTicketNumber(cleanNum);
      setTrackedTicket(found || null);
      setIsSearching(false);
    }, 400);
  };

  const handleSwitchToTrackWithTicket = (ticketNum: string) => {
    setSearchTicketNumber(ticketNum);
    setActiveMode('track');
    setCreatedTicket(null);
    setHasSearched(true);
    const found = StorageService.getComplaintByTicketNumber(ticketNum);
    setTrackedTicket(found || null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Layanan Informasi & Helpdesk TU</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Kontak & Pengaduan Layanan E-Surat
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
          Sampaikan kendala pengajuan surat, perbaikan data, atau pertanyaan seputar layanan Tata Usaha. Setiap laporan mendapat nomor tiket resmi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact info & Operating Hours */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Informasi Loket TU</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              Resmi
            </span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Alamat Sekolah:</span>
                <span className="font-bold text-slate-800 leading-snug block">{settings.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                <Phone className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Telepon Kantor:</span>
                <span className="font-bold text-slate-800 block font-mono">{settings.phone}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Email Resmi TU:</span>
                <span className="font-bold text-slate-800 block">{settings.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                <Globe className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Website Sekolah:</span>
                <a
                  href={settings.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-700 hover:underline block"
                >
                  {settings.website}
                </a>
              </div>
            </div>

            {/* Jam Kerja Loket Card */}
            <div className="pt-2">
              <div
                className={`p-4 rounded-2xl border ${
                  settings.operatingHours?.isRamadanMode
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-xs mb-2 border-b border-slate-200/60 pb-1.5">
                  {settings.operatingHours?.isRamadanMode ? (
                    <>
                      <Moon className="w-4 h-4 text-amber-600" />
                      <span>Jam Layanan Loket (Mode Ramadhan)</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-blue-700" />
                      <span>Jadwal Operasional Loket TU</span>
                    </>
                  )}
                </div>

                {settings.operatingHours?.isRamadanMode ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Senin - Jumat:</span>
                      <span>{settings.operatingHours.ramadanHours}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 italic">
                      *{settings.operatingHours.ramadanNote || 'Khusus Bulan Suci Ramadhan'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Senin - Kamis:</span>
                      <span className="font-bold text-slate-900">
                        {settings.operatingHours?.monThuHours || '08.00 - 15.00 WITA'}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Jumat:</span>
                      <span className="font-bold text-slate-900">
                        {settings.operatingHours?.friHours || '08.00 - 11.30 WITA'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="pt-2 text-[10px] text-slate-500 font-semibold border-t border-slate-200/60 mt-2">
                  {settings.operatingHours?.generalNote || 'Sabtu, Minggu & Hari Libur Nasional Tutup'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/${settings.waAdminNumber}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Loket TU (Fast Response)</span>
            </a>
          </div>
        </div>

        {/* Right Column: Dynamic Form (Kirim Pesan vs Lacak Pengaduan) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="bg-slate-200 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveMode('create');
                setCreatedTicket(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                activeMode === 'create'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Pesan / Pengaduan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('track')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                activeMode === 'track'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lacak Pengaduan (Cek Balasan TU)</span>
            </button>
          </div>

          {/* Mode 1: Kirim Pesan / Pengaduan Form */}
          {activeMode === 'create' && (
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-5 border border-slate-800">
              {createdTicket ? (
                /* Success Card after submitting */
                <div className="space-y-4 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">
                      Pengaduan Berhasil Dikirim!
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Laporan Anda telah tersimpan di sistem Tata Usaha & Google Spreadsheet. Simpan nomor tiket berikut untuk melacak tanggapan staf TU:
                    </p>
                  </div>

                  {/* Ticket Number Highlight Box */}
                  <div className="p-4 bg-slate-800 border-2 border-blue-500/40 rounded-2xl max-w-sm mx-auto space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                      Nomor Tiket Aduan Anda
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black font-mono text-white tracking-wider">
                        {createdTicket.ticketNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTicket(createdTicket.ticketNumber)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 transition"
                        title="Salin Nomor Tiket"
                      >
                        {copiedTicket ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSwitchToTrackWithTicket(createdTicket.ticketNumber)}
                      className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Cek / Lacak Pengaduan Ini Sekarang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreatedTicket(null)}
                      className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                    >
                      Kirim Pesan Lainnya
                    </button>
                  </div>
                </div>
              ) : (
                /* Submission Form */
                <>
                  <div className="border-b border-slate-800 pb-3 space-y-1">
                    <h2 className="text-base font-extrabold text-white">
                      Formulir Pengaduan & Bantuan
                    </h2>
                    <p className="text-xs text-slate-400">
                      Isi data diri dan uraian kendala Anda secara jelas.
                    </p>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs text-slate-300 font-bold mb-1">
                          Nama Lengkap <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nama siswa / alumni / wali..."
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800/90 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-bold mb-1">
                          No. WhatsApp / Email <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="08123456789 atau email..."
                          value={senderContact}
                          onChange={(e) => setSenderContact(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800/90 transition font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 font-bold mb-1">
                        Kategori Pengaduan
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Kendala Permohonan Surat">Kendala Pengajuan Surat</option>
                        <option value="Perbaikan Data Siswa/Alumni">Perbaikan Data Siswa / Alumni</option>
                        <option value="Pertanyaan Syarat Berkas">Pertanyaan Syarat Berkas / Persyaratan</option>
                        <option value="Legalisir & Ijazah">Pertanyaan Legalisir & Pengambilan Surat</option>
                        <option value="Lainnya">Lainnya (Kendala Umum)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 font-bold mb-1">
                        Uraian Pesan / Kendala yang Dialami <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Jelaskan secara rinci kendala Anda, sebutkan nomor permohonan surat jika ada..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800/90 transition"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Mengirim Aduan...' : 'Kirim Pengaduan & Dapatkan No. Tiket'}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Mode 2: Lacak Pengaduan (Search by Ticket Number) */}
          {activeMode === 'track' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="border-b border-slate-100 pb-3 space-y-1">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Lacak Status & Balasan Pengaduan</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Masukkan nomor tiket pengaduan yang Anda dapatkan saat mengirim pesan.
                </p>
              </div>

              {/* Ticket Input Bar */}
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Contoh: TKT-202608-0001"
                    value={searchTicketNumber}
                    onChange={(e) => setSearchTicketNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-600 focus:bg-white transition tracking-wider"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-extrabold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50 shrink-0"
                >
                  <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'Mengecek...' : 'Lacak Tiket'}</span>
                </button>
              </form>

              {/* Result Area */}
              {hasSearched && (
                <div className="space-y-4 pt-2">
                  {trackedTicket ? (
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 animate-in fade-in duration-200">
                      {/* Ticket Header & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Nomor Tiket Pengaduan
                          </span>
                          <span className="text-base font-black font-mono text-slate-900">
                            {trackedTicket.ticketNumber}
                          </span>
                        </div>

                        <div>
                          {trackedTicket.status === 'Baru' && (
                            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs px-3 py-1 rounded-full animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Menunggu Antrean Ditangani</span>
                            </span>
                          )}
                          {trackedTicket.status === 'Sedang Ditangani' && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 border border-blue-300 font-extrabold text-xs px-3 py-1 rounded-full">
                              <AlertCircle className="w-3.5 h-3.5 text-blue-700" />
                              <span>Sedang Ditindaklanjuti TU</span>
                            </span>
                          )}
                          {trackedTicket.status === 'Selesai' && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Pengaduan Selesai Ditanggapi</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ticket Metadata */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Pengirim:</span>
                          <span className="font-bold text-slate-800">{trackedTicket.senderName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Kategori:</span>
                          <span className="font-bold text-slate-800">{trackedTicket.category || 'Umum'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Tanggal Masuk:</span>
                          <span className="font-bold text-slate-800">
                            {new Date(trackedTicket.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* User's Original Message */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          Isi Laporan / Kendala yang Disampaikan:
                        </span>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                          "{trackedTicket.message}"
                        </div>
                      </div>

                      {/* Admin Official Response Box */}
                      {trackedTicket.adminResponse ? (
                        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                              <ShieldCheck className="w-4 h-4 text-emerald-700" />
                              <span>Tanggapan & Solusi Resmi Tata Usaha:</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                              Oleh: {trackedTicket.respondedBy || 'Staf TU'}
                            </span>
                          </div>

                          <p className="text-xs text-emerald-950 font-semibold leading-relaxed whitespace-pre-wrap bg-white/80 p-3 rounded-xl border border-emerald-200">
                            {trackedTicket.adminResponse}
                          </p>

                          {trackedTicket.respondedAt && (
                            <span className="text-[10px] text-emerald-600 block font-medium">
                              Dijawab pada:{' '}
                              {new Date(trackedTicket.respondedAt).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1">
                            <span className="font-bold text-amber-900 block">
                              Pengaduan sedang dalam antrean pemeriksaan staf TU
                            </span>
                            <p className="text-amber-800 leading-relaxed">
                              Staf Tata Usaha akan segera memeriksa kendala Anda dan memberikan tanggapan resmi di halaman ini. Anda juga dapat menghubungi loket WhatsApp jika membutuhkan respon mendesak.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                      <h4 className="font-bold text-rose-900 text-xs">
                        Tiket Tidak Ditemukan
                      </h4>
                      <p className="text-xs text-rose-700 max-w-sm mx-auto">
                        Nomor tiket "<strong>{searchTicketNumber}</strong>" tidak terdaftar di sistem. Mohon periksa kembali nomor tiket yang Anda masukkan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
