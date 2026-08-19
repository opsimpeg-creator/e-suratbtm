import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ComplaintTicket, ComplaintStatus, SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Trash2,
  Download,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ExternalLink,
  Phone,
  Mail,
  User,
  Calendar,
  Sparkles,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface ComplaintManagementProps {
  complaints: ComplaintTicket[];
  settings: SchoolSettings;
  onRefresh: () => void;
}

export const ComplaintManagement: React.FC<ComplaintManagementProps> = ({
  complaints,
  settings,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Response Modal State
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
  const [responseInput, setResponseInput] = useState('');
  const [statusInput, setStatusInput] = useState<ComplaintStatus>('Selesai');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<ComplaintTicket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Stats calculation
  const totalComplaints = complaints.length;
  const newCount = complaints.filter((c) => c.status === 'Baru').length;
  const inProgressCount = complaints.filter((c) => c.status === 'Sedang Ditangani').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Selesai').length;

  // Filter & Search Logic
  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.ticketNumber.toLowerCase().includes(q) ||
      c.senderName.toLowerCase().includes(q) ||
      c.senderContact.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q) ||
      (c.adminResponse && c.adminResponse.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalItems = filteredComplaints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

  const handleCopyTicket = (ticketNumber: string) => {
    navigator.clipboard.writeText(ticketNumber);
    setCopiedTicketId(ticketNumber);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };

  const handleOpenResponseModal = (ticket: ComplaintTicket) => {
    setSelectedTicket(ticket);
    setResponseInput(ticket.adminResponse || '');
    setStatusInput(ticket.status === 'Baru' ? 'Selesai' : ticket.status);
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    if (!responseInput.trim()) {
      alert('Mohon masukkan isi tanggapan / jawaban balasan untuk pengadu.');
      return;
    }

    setIsSubmittingResponse(true);
    const currentUser = StorageService.getCurrentUser();
    const actorName = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Staf TU Admin';

    const success = StorageService.updateComplaintResponse(
      selectedTicket.id,
      responseInput,
      statusInput,
      actorName
    );

    if (success) {
      // Sync to spreadsheet in background
      const updatedTicket = StorageService.getComplaintById(selectedTicket.id);
      if (updatedTicket) {
        AppsScriptService.sendComplaintToAppsScript(updatedTicket).catch(() => {});
      }
      setSelectedTicket(null);
      onRefresh();
    } else {
      alert('Gagal menyimpan tanggapan.');
    }
    setIsSubmittingResponse(false);
  };

  const handleSendWhatsAppReply = (ticket: ComplaintTicket) => {
    // Sanitize phone number
    let cleanPhone = ticket.senderContact.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const replyText = responseInput || ticket.adminResponse || 'Pengaduan Anda sedang kami tindak lanjuti.';
    const textMessage = `*Tanggapan Resmi Layanan E-Surat & Pengaduan ${settings.schoolName}*\n\n` +
      `Halo *${ticket.senderName}*,\n` +
      `Terkait tiket pengaduan *#${ticket.ticketNumber}* mengenai: "${ticket.message.slice(0, 100)}..."\n\n` +
      `*Jawaban / Tanggapan Staf TU:*\n${replyText}\n\n` +
      `Status Aduan: *${statusInput || ticket.status}*\n\n` +
      `Terima kasih telah menghubungi loket Tata Usaha.`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`;
    window.open(waUrl, '_blank');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const id = deleteTarget.id;
    const ticketNumber = deleteTarget.ticketNumber;

    StorageService.deleteComplaint(id);
    AppsScriptService.deleteComplaintInAppsScript(id, ticketNumber).catch(() => {});

    setDeleteTarget(null);
    setIsDeleting(false);
    onRefresh();
  };

  const handleExportExcel = () => {
    if (filteredComplaints.length === 0) {
      alert('Tidak ada data pengaduan untuk diekspor.');
      return;
    }

    const exportData = filteredComplaints.map((c, index) => ({
      No: index + 1,
      'No. Tiket': c.ticketNumber,
      'Nama Pengirim': c.senderName,
      'Kontak (HP/Email)': c.senderContact,
      Kategori: c.category || 'Umum',
      'Isi Pesan / Kendala': c.message,
      Status: c.status,
      'Tanggapan Admin': c.adminResponse || '-',
      'Tanggal Masuk': new Date(c.createdAt).toLocaleString('id-ID'),
      'Tanggal Ditanggapi': c.respondedAt ? new Date(c.respondedAt).toLocaleString('id-ID') : '-',
      'Ditanggapi Oleh': c.respondedBy || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pengaduan TU');

    const fileName = `Data_Pengaduan_TU_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleSyncSpreadsheet = async () => {
    setIsSyncing(true);
    try {
      const res = await AppsScriptService.syncAllToAppsScript();
      alert(res.message);
      onRefresh();
    } catch (e: any) {
      alert('Sinkronisasi gagal: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Page Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Pesan & Pengaduan
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Kelola aduan, kendala surat, dan pertanyaan siswa/alumni lengkap dengan nomor tiket & integrasi Google Spreadsheet.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleSyncSpreadsheet}
            disabled={isSyncing}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
            title="Sinkronkan seluruh pengaduan ke Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sync Spreadsheet'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Pengaduan
            </span>
            <span className="text-2xl font-black text-slate-900">{totalComplaints}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Aduan Baru (Belum Dibalas)
            </span>
            <span className="text-2xl font-black text-amber-700">{newCount}</span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Sedang Ditangani
            </span>
            <span className="text-2xl font-black text-blue-700">{inProgressCount}</span>
          </div>
          <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Selesai Ditanggapi
            </span>
            <span className="text-2xl font-black text-emerald-700">{resolvedCount}</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Tiket, Nama, Kontak, atau Pesan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({totalComplaints})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Baru');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === 'Baru'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Baru ({newCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Sedang Ditangani');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === 'Sedang Ditangani'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Diproses ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Selesai');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === 'Selesai'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Selesai ({resolvedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">No. Tiket</th>
                <th className="py-3.5 px-4">Pengirim & Kontak</th>
                <th className="py-3.5 px-4">Isi Pesan / Kendala</th>
                <th className="py-3.5 px-4">Tanggal Masuk</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Tanggapan Staf TU</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-xs text-slate-500">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Tidak ada pengaduan yang sesuai dengan kriteria pencarian.'
                          : 'Belum ada pesan atau pengaduan yang masuk.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((ticket, index) => {
                  const globalIndex = startIndex + index + 1;
                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-blue-50/40 transition group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {globalIndex}
                      </td>

                      {/* Ticket Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 border border-slate-200 text-blue-800 text-[11px] px-2 py-0.5 rounded-lg">
                            {ticket.ticketNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTicket(ticket.ticketNumber)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Salin Nomor Tiket"
                          >
                            {copiedTicketId === ticket.ticketNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Sender Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 min-w-[140px]">
                          <span className="font-bold text-slate-900 block text-xs">
                            {ticket.senderName}
                          </span>
                          <span className="text-[11px] text-slate-500 block font-mono">
                            {ticket.senderContact}
                          </span>
                        </div>
                      </td>

                      {/* Message Content */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          {ticket.category && (
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {ticket.category}
                            </span>
                          )}
                          <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                            {ticket.message}
                          </p>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-700 block">
                            {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {new Date(ticket.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {ticket.status === 'Baru' && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] px-2.5 py-1 rounded-full animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Aduan Baru</span>
                          </span>
                        )}
                        {ticket.status === 'Sedang Ditangani' && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10px] px-2.5 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            <span>Diproses</span>
                          </span>
                        )}
                        {ticket.status === 'Selesai' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Selesai</span>
                          </span>
                        )}
                      </td>

                      {/* Admin Response */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {ticket.adminResponse ? (
                          <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                            <p className="text-[11px] text-emerald-950 font-medium line-clamp-2 leading-relaxed">
                              {ticket.adminResponse}
                            </p>
                            <span className="text-[9px] text-emerald-600 block font-semibold">
                              Oleh: {ticket.respondedBy || 'Staf TU'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada tanggapan
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenResponseModal(ticket)}
                            className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
                            title="Buka & Kirim Tanggapan Resmi TU"
                          >
                            <Send className="w-3 h-3" />
                            <span>{ticket.adminResponse ? 'Edit Balasan' : 'Tindak Lanjut'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ticket)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition"
                            title="Hapus Tiket Pengaduan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalItems > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
              >
                <option value={10}>10 data / hal</option>
                <option value={25}>25 data / hal</option>
                <option value={50}>50 data / hal</option>
                <option value={100}>100 data / hal</option>
              </select>
              <span className="text-slate-400">|</span>
              <span>
                Menampilkan <strong className="text-slate-900">{startIndex + 1}</strong> -{' '}
                <strong className="text-slate-900">{endIndex}</strong> dari{' '}
                <strong className="text-slate-900">{totalItems}</strong> aduan
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-900">
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Response / Follow-up Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600/60 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg border border-blue-400/40">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className="text-xs text-blue-200 font-semibold">Tindak Lanjut Pengaduan</span>
                </div>
                <h3 className="text-base font-extrabold text-white">
                  Tanggapan Resmi Tata Usaha
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <form onSubmit={handleSaveResponse} className="p-5 space-y-4 overflow-y-auto">
              {/* Sender Details Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedTicket.senderName}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedTicket.senderContact}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Isi Pengaduan / Pertanyaan:
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded-xl border border-slate-200">
                    "{selectedTicket.message}"
                  </p>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Status Penyelesaian Aduan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusInput('Sedang Ditangani')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      statusInput === 'Sedang Ditangani'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Sedang Ditangani</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusInput('Selesai')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      statusInput === 'Selesai'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesai (Tuntas)</span>
                  </button>
                </div>
              </div>

              {/* Response Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Isi Tanggapan / Jawaban Resmi Staf TU: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={responseInput}
                  onChange={(e) => setResponseInput(e.target.value)}
                  placeholder="Tuliskan jawaban solusi, penjelasan, atau tindak lanjut dari pihak Tata Usaha..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Jawaban ini akan dapat dilihat langsung oleh pengadu saat mengecek nomor tiket di Landing Page.
                </p>
              </div>

              {/* Quick WhatsApp Action if phone number */}
              {selectedTicket.senderContact && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 text-xs block">
                        Balas Cepat via WhatsApp
                      </span>
                      <span className="text-[10px] text-emerald-700 block font-mono">
                        {selectedTicket.senderContact}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppReply(selectedTicket)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <span>Kirim WA</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Footer Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResponse}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingResponse ? 'Menyimpan...' : 'Simpan & Publikasikan Balasan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Tiket Pengaduan?"
        message={`Apakah Anda yakin ingin menghapus data pengaduan dengan No. Tiket ${deleteTarget?.ticketNumber} dari ${deleteTarget?.senderName}?`}
        confirmText="Ya, Hapus Tiket"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
