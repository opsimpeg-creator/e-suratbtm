import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SubmissionRequest, LetterType, SchoolSettings, RequestStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import { PdfGenerator } from '../../services/pdfGenerator';
import { ConfirmModal } from '../common/ConfirmModal';
import { PdfQrStamperModal } from './PdfQrStamperModal';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  FileCheck,
  Hash,
  Send,
  UserCheck,
  Calendar,
  Sparkles,
  Printer,
  Paperclip,
  ExternalLink,
  FileDown,
  Eye as EyeIcon,
  Maximize2,
  Upload,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  QrCode
} from 'lucide-react';

interface RequestManagementProps {
  submissions: SubmissionRequest[];
  letterTypes: LetterType[];
  settings: SchoolSettings;
  onRefresh: () => void;
  selectedRequestFromDash?: SubmissionRequest | null;
  initialStatusFilter?: string;
}

export const RequestManagement: React.FC<RequestManagementProps> = ({
  submissions,
  letterTypes,
  settings,
  onRefresh,
  selectedRequestFromDash = null,
  initialStatusFilter = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<SubmissionRequest | null>(selectedRequestFromDash);

  // Sync filter when initialStatusFilter changes
  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
      setCurrentPage(1);
    }
  }, [initialStatusFilter]);

  // Sync selectedRequest if provided from dashboard
  React.useEffect(() => {
    if (selectedRequestFromDash) {
      setSelectedRequest(selectedRequestFromDash);
    }
  }, [selectedRequestFromDash]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Status Change Form Modal State
  const [modalStatus, setModalStatus] = useState<RequestStatus>('Diproses');
  const [modalNote, setModalNote] = useState('');
  const [modalRejection, setModalRejection] = useState('');
  const [officialNumberInput, setOfficialNumberInput] = useState('');
  const [officialDateInput, setOfficialDateInput] = useState('');

  // Official Letter Manual Upload State
  const [uploadedOfficialFileUrl, setUploadedOfficialFileUrl] = useState<string>('');
  const [uploadedOfficialFileName, setUploadedOfficialFileName] = useState<string>('');
  const [isUploadingOfficial, setIsUploadingOfficial] = useState(false);
  const [isQrStamperOpen, setIsQrStamperOpen] = useState(false);

  // Preview File Modal State
  const [previewModalFile, setPreviewModalFile] = useState<{ fileName: string; fileUrl: string; fileSize?: string } | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    name: string;
    requestNumber: string;
    letterTypeName: string;
  } | null>(null);

  // Clear All Confirmation Modal State
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Background auto-pull on mount if Web App URL is configured
  React.useEffect(() => {
    if (settings.webAppUrl) {
      AppsScriptService.fetchDataFromAppsScript(true).then((res) => {
        if (res.success) {
          onRefresh();
        }
      }).catch(() => {});
    }
  }, [settings.webAppUrl]);

  const handlePullFromSpreadsheet = async () => {
    setIsPulling(true);
    const res = await AppsScriptService.fetchDataFromAppsScript();
    setIsPulling(false);
    alert(res.message);
    if (res.success) {
      onRefresh();
    }
  };

  const handleOpenDeleteConfirm = (id: string, name: string, reqNum: string, letterTypeName: string) => {
    setDeleteConfirmTarget({
      id,
      name,
      requestNumber: reqNum,
      letterTypeName,
    });
  };

  const handleConfirmDeleteSubmission = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      StorageService.deleteSubmission(deleteConfirmTarget.id);
      onRefresh();
      setDeleteConfirmTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenClearAllConfirm = () => {
    setIsClearAllConfirmOpen(true);
  };

  const handleConfirmClearAll = async () => {
    setIsDeleting(true);
    try {
      StorageService.clearAllSubmissions();
      onRefresh();
      setIsClearAllConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPhoneNumberForWa = (phone: string): string => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const getWhatsAppUrl = (phone: string, message: string): string => {
    const formattedPhone = formatPhoneNumberForWa(phone);
    if (!formattedPhone) return '#';
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const base64ToBlobUrl = (dataUrl: string): string => {
    if (!dataUrl) return '';
    if (!dataUrl.startsWith('data:')) return dataUrl;
    try {
      const parts = dataUrl.split(';base64,');
      if (parts.length < 2) return dataUrl;
      const contentType = parts[0].replace('data:', '');
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Failed base64 conversion', e);
      return dataUrl;
    }
  };

  const handleOpenPreview = (rawUrl: string, fileName: string, fileSize?: string) => {
    if (!rawUrl) return;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const safeUrl = base64ToBlobUrl(rawUrl);
    setPreviewModalFile({
      fileName,
      fileUrl: safeUrl,
      fileSize,
    });
  };

  const handleDownloadFile = (rawUrl: string, fileName: string) => {
    if (!rawUrl) return;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const safeUrl = base64ToBlobUrl(rawUrl);
    const a = document.createElement('a');
    a.href = safeUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredSubmissions = submissions.filter((req) => {
    const matchesSearch =
      req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.officialLetterNumber && req.officialLetterNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.letterTypeId === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalItems = filteredSubmissions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  const openDetailModal = (req: SubmissionRequest) => {
    setSelectedRequest(req);
    setModalStatus(req.status);
    setModalNote(req.processingNote || '');
    setModalRejection(req.rejectionReason || '');
    setOfficialNumberInput(req.officialLetterNumber || '');
    setOfficialDateInput(req.officialLetterDate || new Date().toISOString().split('T')[0]);
    setUploadedOfficialFileUrl(req.issuedDocumentUrl || '');
    setUploadedOfficialFileName(req.formData?._officialFileName || `Surat_Resmi_${req.requestNumber}.pdf`);
  };

  const handleOfficialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 20 MB.');
      return;
    }

    setIsUploadingOfficial(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedOfficialFileUrl(result);
      setUploadedOfficialFileName(file.name);
      setIsUploadingOfficial(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca file.');
      setIsUploadingOfficial(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAutoGenerateNumber = () => {
    const generated = StorageService.generateNextOfficialLetterNumber();
    setOfficialNumberInput(generated);
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const currentUser = StorageService.getCurrentUser();
    const actorName = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Staf TU Admin';

    // Save official file name in formData if present
    if (uploadedOfficialFileName && selectedRequest.formData) {
      selectedRequest.formData._officialFileName = uploadedOfficialFileName;
    }

    StorageService.updateRequestStatus(
      selectedRequest.id,
      modalStatus,
      actorName,
      modalNote,
      modalStatus === 'Ditolak' ? modalRejection : undefined,
      modalStatus === 'Selesai' ? officialNumberInput : undefined,
      modalStatus === 'Selesai' ? officialDateInput : undefined,
      uploadedOfficialFileUrl
    );

    onRefresh();
    setSelectedRequest(null);
  };

  const exportToExcel = () => {
    const dataToExport = filteredSubmissions.map((s, i) => ({
      No: i + 1,
      NoPermohonan: s.requestNumber,
      NamaPemohon: s.applicantName,
      Email: s.applicantEmail,
      HP: s.applicantPhone,
      Role: s.applicantRole,
      JenisSurat: s.letterTypeName,
      Status: s.status,
      NomorSuratResmi: s.officialLetterNumber || '-',
      TanggalPermohonan: new Date(s.createdAt).toLocaleString('id-ID'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DataPermohonanTU');
    XLSX.writeFile(workbook, `Permohonan_Surat_TU_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari pemohon, no. resi, atau no. surat..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={handlePullFromSpreadsheet}
              disabled={isPulling}
              className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Tarik data permohonan terbaru dari Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Menarik...' : 'Tarik dari Spreadsheet'}</span>
            </button>

            <button
              onClick={exportToExcel}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenClearAllConfirm}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Kosongkan seluruh data permohonan di aplikasi (Reset)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Data</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </div>

          {['all', 'Menunggu', 'Diproses', 'Selesai', 'Ditolak'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full font-semibold transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st}
            </button>
          ))}

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="ml-auto px-3 py-1 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700"
          >
            <option value="all">Semua Jenis Surat</option>
            {letterTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700 relative">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="p-4 bg-slate-50">No. Permohonan</th>
                <th className="p-4 bg-slate-50">Nama Pemohon</th>
                <th className="p-4 bg-slate-50">Jenis Surat</th>
                <th className="p-4 bg-slate-50">Tanggal Masuk</th>
                <th className="p-4 bg-slate-50">Status</th>
                <th className="p-4 bg-slate-50">No. Surat Resmi</th>
                <th className="p-4 bg-slate-50 text-right">Aksi Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada data permohonan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-blue-800">{req.requestNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{req.applicantName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{req.applicantPhone}</span>
                        {req.applicantPhone && (
                          <a
                            href={getWhatsAppUrl(
                              req.applicantPhone,
                              req.status === 'Selesai'
                                ? `Yth. *${req.applicantName}*,\n\nPermohonan *${req.letterTypeName}* Anda (No. Resi: *${req.requestNumber}*) dengan No. Surat Resmi: *${req.officialLetterNumber || '-'}* telah *SELESAI* dan dapat diambil di Ruang TU Sekolah / diunduh secara online.\n\nTerima kasih.`
                                : `Yth. *${req.applicantName}*,\n\nMengenai permohonan *${req.letterTypeName}* Anda (No. Resi: *${req.requestNumber}*)...`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5 transition shrink-0"
                            title="Hubungi pemohon via WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WA</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{req.letterTypeName}</td>
                    <td className="p-4 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
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
                    </td>
                    <td className="p-4 font-mono text-slate-700">
                      {req.officialLetterNumber || <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailModal(req)}
                          className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail & Proses</span>
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm(req.id, req.applicantName, req.requestNumber, req.letterTypeName)}
                          className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white p-2 rounded-xl transition"
                          title="Hapus Permohonan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
            >
              <option value={10}>10 data</option>
              <option value={25}>25 data</option>
              <option value={50}>50 data</option>
              <option value={100}>100 data</option>
            </select>
            <span className="text-slate-500 ml-2">
              {totalItems > 0 ? `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalItems} data` : '0 data'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail & Process Status Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-blue-400 font-mono text-xs font-bold">{selectedRequest.requestNumber}</span>
                <h2 className="text-xl font-extrabold text-white mt-0.5">{selectedRequest.letterTypeName}</h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1 text-xs">
              {/* Grid Data Pemohon & Dynamic Form Responses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Applicant Details */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                    Identitas Pemohon
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <p className="font-bold text-slate-900 text-sm">{selectedRequest.applicantName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <p className="font-semibold text-slate-800">{selectedRequest.applicantEmail}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Nomor WhatsApp:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="font-semibold text-slate-800">{selectedRequest.applicantPhone}</p>
                        {selectedRequest.applicantPhone && (
                          <a
                            href={getWhatsAppUrl(
                              selectedRequest.applicantPhone,
                              selectedRequest.status === 'Selesai'
                                ? `Yth. *${selectedRequest.applicantName}*,\n\nPermohonan *${selectedRequest.letterTypeName}* Anda (No. Resi: *${selectedRequest.requestNumber}*) dengan No. Surat Resmi: *${selectedRequest.officialLetterNumber || '-'}* telah *SELESAI* dan dapat diambil di Ruang TU Sekolah / diunduh secara online.\n\nTerima kasih.`
                                : `Yth. *${selectedRequest.applicantName}*,\n\nInformasi mengenai permohonan *${selectedRequest.letterTypeName}* (No. Resi: *${selectedRequest.requestNumber}*) Anda saat ini berstatus: *${selectedRequest.status}*.\n\nTerima kasih.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs transition shrink-0"
                            title="Buka Chat WhatsApp dengan Pemohon"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat WA</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Status Role:</span>
                      <p className="font-bold text-blue-700 uppercase">{selectedRequest.applicantRole}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Isian Form Response & Lampiran */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>Jawaban Formulir & Lampiran</span>
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {(() => {
                      const formDataEntries = Object.entries(selectedRequest.formData);
                      const isHttpUrl = (str: string) => typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://'));

                      // Filter out internal keys starting with _ and secondary DRIVELINK entries
                      const filteredEntries = formDataEntries.filter(([k]) => {
                        if (k.startsWith('_')) return false;
                        if (k.toLowerCase().includes('drivelink')) {
                          const cleanKeyName = k.toLowerCase().replace(/drivelink/i, '').trim();
                          const hasPrimaryKey = formDataEntries.some(([otherKey]) => {
                            const otherLower = otherKey.toLowerCase();
                            return !otherLower.includes('drivelink') && (otherLower.includes(cleanKeyName) || (cleanKeyName.length > 2 && otherLower.includes(cleanKeyName)));
                          });
                          if (hasPrimaryKey) return false;
                        }
                        return true;
                      });

                      return filteredEntries.map(([k, v]) => {
                        const valStr = String(v);
                        const isValUrl = isHttpUrl(valStr);

                        // Look for matching DRIVELINK key in formData for this field if v is not a URL itself
                        let driveUrlFromFormData: string | undefined = undefined;
                        if (!isValUrl) {
                          const matchingDriveKey = formDataEntries.find(([otherKey, otherVal]) => {
                            const otherLower = otherKey.toLowerCase();
                            return otherLower.includes('drivelink') && 
                                   (otherLower.includes(k.toLowerCase()) || k.toLowerCase().includes(otherLower.replace(/drivelink/i, '').trim())) &&
                                   isHttpUrl(String(otherVal));
                          });
                          if (matchingDriveKey) {
                            driveUrlFromFormData = String(matchingDriveKey[1]);
                          }
                        }

                        const uploadedFiles = selectedRequest.uploadedFiles as Record<string, { fileName: string; fileUrl: string; fileSize?: string }> | undefined;
                        const uploadedObj = uploadedFiles?.[k] || 
                          Object.values(uploadedFiles || {}).find((f) => f?.fileName === valStr);

                        const isFileField = k.toLowerCase().includes('file') || 
                                            k.toLowerCase().includes('scan') || 
                                            k.toLowerCase().includes('ijazah') || 
                                            k.toLowerCase().includes('lampiran') ||
                                            k.toLowerCase().includes('kk') ||
                                            k.toLowerCase().includes('ktp') ||
                                            isValUrl ||
                                            driveUrlFromFormData !== undefined ||
                                            valStr.match(/\.(pdf|jpg|jpeg|png|doc|docx)$/i);

                        const fileUrl = uploadedObj?.fileUrl || (isValUrl ? valStr : driveUrlFromFormData) || 
                          (isFileField ? `data:text/plain;charset=utf-8,${encodeURIComponent(`Lampiran Dokumen: ${v}\nNomor Permohonan: ${selectedRequest.requestNumber}\nPemohon: ${selectedRequest.applicantName}`)}` : null);

                        const isLink = fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'));

                        return (
                          <div key={k} className="border-b border-slate-200 pb-2.5">
                            <span className="text-slate-500 uppercase text-[10px] font-semibold block">{k.replace(/_/g, ' ')}</span>
                            <p className="font-bold text-slate-900 break-words">{valStr}</p>
                            
                            {isFileField && (
                              <div className="mt-2 bg-white p-3 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                                    <Paperclip className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-xs truncate">{uploadedObj?.fileName || valStr}</p>
                                    <span className="text-[10px] text-slate-500 block font-medium">
                                      {uploadedObj?.fileSize ? `Ukuran: ${uploadedObj.fileSize}` : (isLink ? 'Google Drive / Tautan Berkas' : 'Berkas Dokumen Lampiran Pemohon')}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(fileUrl || '', uploadedObj?.fileName || valStr, uploadedObj?.fileSize)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                                    title={isLink ? 'Buka Tautan Google Drive' : 'Pratinjau / Buka Lampiran Dokumen'}
                                  >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                    <span>{isLink ? 'Buka Link' : 'Lihat'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(fileUrl || '', uploadedObj?.fileName || valStr)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-all border border-slate-300"
                                    title="Unduh / Buka File Lampiran"
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span>Unduh</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleSaveStatus} className="bg-blue-50/70 p-6 rounded-3xl border border-blue-200 space-y-6">
                <h3 className="font-extrabold text-blue-950 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-700" />
                  <span>Proses & Update Status Permohonan</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Status Terbaru *</label>
                    <select
                      value={modalStatus}
                      onChange={(e: any) => setModalStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900"
                    >
                      <option value="Menunggu">Menunggu Verifikasi</option>
                      <option value="Diproses">Diproses Staf TU</option>
                      <option value="Selesai">Selesai / Terbit Surat</option>
                      <option value="Ditolak">Ditolak / Berkas Tidak Lengkap</option>
                    </select>
                  </div>

                  {modalStatus === 'Selesai' && (
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Nomor Surat Resmi *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={officialNumberInput}
                          onChange={(e) => setOfficialNumberInput(e.target.value)}
                          placeholder="420/001/TU-SMK/2026"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleAutoGenerateNumber}
                          className="bg-blue-700 text-white font-bold px-3 py-2 rounded-xl hover:bg-blue-800 whitespace-nowrap text-xs flex items-center gap-1"
                          title="Generate Otomatis Urutan"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Auto</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {modalStatus === 'Selesai' && (
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Tanggal Surat Resmi</label>
                      <input
                        type="date"
                        value={officialDateInput}
                        onChange={(e) => setOfficialDateInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                      />
                    </div>
                  )}

                  {modalStatus === 'Ditolak' && (
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-rose-800 mb-1">Alasan Penolakan *</label>
                      <textarea
                        rows={2}
                        value={modalRejection}
                        onChange={(e) => setModalRejection(e.target.value)}
                        placeholder="Tuliskan catatan alasan penolakan..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 text-xs bg-rose-50/50"
                        required
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Catatan Staf TU (Opsional)</label>
                    <input
                      type="text"
                      value={modalNote}
                      onChange={(e) => setModalNote(e.target.value)}
                      placeholder="Contoh: Berkas cocok dengan Dapodik, siap dicetak."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>

                  {/* Upload Berkas Surat Resmi (Manual Admin) */}
                  <div className="sm:col-span-2 p-4 bg-white rounded-2xl border border-blue-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-blue-700" />
                        <span>Upload Berkas Surat Resmi (Hasil Pembuatan Manual Staf TU)</span>
                      </label>
                      {uploadedOfficialFileUrl && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dokumen Ter-Upload
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Upload berkas surat resmi (format PDF, Scan/Foto JPG/PNG, atau DOC) yang dibuat manual oleh Staf TU agar dapat dipratinjau & diunduh oleh pemohon di halaman Cek Status.
                    </p>

                    {uploadedOfficialFileUrl ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 bg-blue-700 text-white rounded-xl shrink-0 shadow-xs">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {uploadedOfficialFileName || `Surat_Resmi_${selectedRequest.requestNumber}.pdf`}
                            </p>
                            <span className="text-[10px] text-slate-500 block font-medium">
                              Surat Resmi Hasil Upload Manual Admin
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsQrStamperOpen(true)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition"
                            title="Buka Penempelan QR Code Interaktif (e-Meterai Style)"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Tempel / Atur Posisi QR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(uploadedOfficialFileUrl, uploadedOfficialFileName || `Surat_Resmi_${selectedRequest.requestNumber}.pdf`)}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>Pratinjau</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedOfficialFileUrl('');
                              setUploadedOfficialFileName('');
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                            title="Hapus / Ganti Berkas Surat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-blue-50/40 transition group relative cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          onChange={handleOfficialFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="p-2 bg-blue-100 text-blue-700 rounded-2xl group-hover:scale-110 transition-transform">
                            {isUploadingOfficial ? <Clock className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            {isUploadingOfficial ? 'Mengunggah file...' : 'Klik atau seret file Surat Resmi ke sini'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Mendukung file PDF, Hasil Scan/Foto (JPG/PNG), atau Dokumen Word (Maks. 20MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-blue-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (uploadedOfficialFileUrl) {
                          handleDownloadFile(
                            uploadedOfficialFileUrl,
                            uploadedOfficialFileName || `Surat_Resmi_${selectedRequest.requestNumber}.pdf`
                          );
                        } else {
                          const tpl = StorageService.getTemplateForLetterType(selectedRequest.letterTypeId);
                          PdfGenerator.generateOfficialLetterPdf(selectedRequest, tpl, settings);
                        }
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Unduh Surat Resmi</span>
                    </button>

                    {selectedRequest.applicantPhone && (
                      <a
                        href={getWhatsAppUrl(
                          selectedRequest.applicantPhone,
                          modalStatus === 'Selesai' || selectedRequest.status === 'Selesai'
                            ? `Yth. *${selectedRequest.applicantName}*,\n\nPermohonan surat Anda pada Layanan e-Surat Tata Usaha Sekolah:\n- Jenis Surat: *${selectedRequest.letterTypeName}*\n- No. Resi: *${selectedRequest.requestNumber}*\n- No. Surat Resmi: *${officialNumberInput || selectedRequest.officialLetterNumber || '-'}*\n- Status: *SELESAI / DAPAT DIAMBIL*\n\nSurat resmi Anda telah diterbitkan dan siap diambil di Ruang Tata Usaha (TU) Sekolah / diunduh secara online.\n\nTerima kasih.\n*Subbagian Tata Usaha - ${settings.schoolName || 'SMK'}*`
                            : modalStatus === 'Ditolak'
                            ? `Yth. *${selectedRequest.applicantName}*,\n\nMengenai permohonan surat *${selectedRequest.letterTypeName}* (No. Resi: *${selectedRequest.requestNumber}*):\nStatus permohonan saat ini *DITOLAK* dengan catatan: ${modalRejection || selectedRequest.rejectionReason || '-'}.\n\nSilakan perbaiki berkas/persyaratan Anda. Terima kasih.`
                            : `Yth. *${selectedRequest.applicantName}*,\n\nInformasi permohonan surat *${selectedRequest.letterTypeName}* (No. Resi: *${selectedRequest.requestNumber}*):\nStatus saat ini: *${modalStatus}*.\nCatatan: ${modalNote || selectedRequest.processingNote || 'Sedang dalam proses petugas TU'}.\n\nTerima kasih.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                        title="Kirim Pesan Pemberitahuan WhatsApp ke Pemohon"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Kirim WA ke Pemohon</span>
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Simpan Perubahan Status</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Dokumen Lampiran */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-600/30 text-blue-300 rounded-xl">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">{previewModalFile.fileName}</h3>
                  {previewModalFile.fileSize && (
                    <span className="text-xs text-slate-400 font-medium">{previewModalFile.fileSize}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewModalFile.fileUrl, previewModalFile.fileName)}
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold px-3 bg-slate-800/60"
                  title="Unduh File"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>
                <a
                  href={previewModalFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold px-3 bg-slate-800/60"
                  title="Buka di Tab Baru"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalFile(null)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="p-4 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[400px]">
              {previewModalFile.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) || previewModalFile.fileUrl.startsWith('data:image/') ? (
                <img
                  src={previewModalFile.fileUrl}
                  alt={previewModalFile.fileName}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200"
                />
              ) : previewModalFile.fileName.match(/\.pdf$/i) || previewModalFile.fileUrl.includes('pdf') || previewModalFile.fileUrl.startsWith('data:application/pdf') || previewModalFile.fileUrl.startsWith('blob:') ? (
                <iframe
                  src={previewModalFile.fileUrl}
                  title={previewModalFile.fileName}
                  className="w-full h-[70vh] rounded-xl border border-slate-300 shadow-inner bg-white"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
                  <Paperclip className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1">{previewModalFile.fileName}</h4>
                  <p className="text-xs text-slate-500 mb-4">Pratinjau langsung tidak tersedia untuk format file ini. Silakan unduh atau buka file.</p>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(previewModalFile.fileUrl, previewModalFile.fileName)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh File Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Single Submission Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmTarget}
        onClose={() => setDeleteConfirmTarget(null)}
        onConfirm={handleConfirmDeleteSubmission}
        title="Hapus Permohonan Surat?"
        message="Apakah Anda yakin ingin menghapus data permohonan surat ini secara permanen dari sistem dan Google Spreadsheet? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Permohonan"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        itemDetails={
          deleteConfirmTarget
            ? [
                {
                  label: 'No. Permohonan',
                  value: deleteConfirmTarget.requestNumber,
                  isBadge: true,
                  badgeColor: 'bg-blue-100 text-blue-800',
                },
                {
                  label: 'Nama Pemohon',
                  value: deleteConfirmTarget.name,
                },
                {
                  label: 'Jenis Surat',
                  value: deleteConfirmTarget.letterTypeName,
                },
              ]
            : undefined
        }
      />

      {/* Clear All Submissions Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Kosongkan Seluruh Data Permohonan?"
        message="PERINGATAN! Seluruh data permohonan surat di aplikasi akan dihapus secara menyeluruh agar sinkron dengan Google Spreadsheet yang sudah dikosongkan. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Kosongkan Seluruh Data"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Interactive PDF QR Stamper Modal (e-Meterai Style) */}
      {isQrStamperOpen && selectedRequest && uploadedOfficialFileUrl && (
        <PdfQrStamperModal
          isOpen={isQrStamperOpen}
          onClose={() => setIsQrStamperOpen(false)}
          fileDataUri={uploadedOfficialFileUrl}
          fileName={uploadedOfficialFileName || `Surat_Resmi_${selectedRequest.requestNumber}.pdf`}
          requestNumber={selectedRequest.requestNumber}
          officialNumber={officialNumberInput || selectedRequest.officialLetterNumber}
          schoolName={settings.schoolName}
          verificationUrl={`${window.location.origin}?verify=${encodeURIComponent(selectedRequest.qrVerificationCode || selectedRequest.requestNumber)}`}
          onStampComplete={(stampedUri, stampedName) => {
            setUploadedOfficialFileUrl(stampedUri);
            setUploadedOfficialFileName(stampedName);
          }}
        />
      )}
    </div>
  );
};
