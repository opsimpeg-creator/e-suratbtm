import React, { useState, useEffect } from 'react';
import { LetterType, FormField, SubmissionRequest, SchoolSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { AppsScriptService } from '../../services/appsScript';
import { X, Send, AlertCircle, FileText, CheckCircle2, Upload, Lock, ShieldAlert, Sparkles, Database } from 'lucide-react';

interface SubmitRequestModalProps {
  selectedType: LetterType | null;
  settings: SchoolSettings;
  onClose: () => void;
  onSuccess: (request: SubmissionRequest) => void;
}

export const SubmitRequestModal: React.FC<SubmitRequestModalProps> = ({
  selectedType,
  settings: initialSettings,
  onClose,
  onSuccess,
}) => {
  if (!selectedType) return null;

  const [currentSettings, setCurrentSettings] = useState<SchoolSettings>(initialSettings);
  const fields = StorageService.getFieldsForLetterType(selectedType.id);

  // Form State
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantRole, setApplicantRole] = useState<'siswa' | 'alumni' | 'orang_tua' | 'lainnya'>('siswa');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { fileName: string; fileUrl: string; fileSize?: string }>>({});

  // Captcha State
  const [num1, setNum1] = useState(4);
  const [num2, setNum2] = useState(3);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncingMaster, setIsSyncingMaster] = useState(false);

  // Fetch freshest Master Kelas & Jurusan from Spreadsheet on mount
  useEffect(() => {
    const fresh = StorageService.getSettings();
    setCurrentSettings(fresh);

    // Background fetch from Spreadsheet
    setIsSyncingMaster(true);
    AppsScriptService.fetchMasterDataFromSpreadsheet(true)
      .then((res) => {
        if (res.success) {
          setCurrentSettings(StorageService.getSettings());
        }
      })
      .catch((err) => {
        console.warn('Master data background fetch notice:', err);
      })
      .finally(() => {
        setIsSyncingMaster(false);
      });
  }, []);

  // Generate random captcha on open
  useEffect(() => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setNum1(n1);
    setNum2(n2);

    // Auto load draft if exists
    const draftKey = `tu_draft_${selectedType.id}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.applicantName) setApplicantName(parsed.applicantName);
        if (parsed.applicantEmail) setApplicantEmail(parsed.applicantEmail);
        if (parsed.applicantPhone) setApplicantPhone(parsed.applicantPhone);
        if (parsed.applicantRole) setApplicantRole(parsed.applicantRole);
        if (parsed.formData) setFormData(parsed.formData);
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedType]);

  // Helper to dynamically resolve options from Google Spreadsheet Master
  const resolveFieldOptions = (field: FormField): { options: string[]; isFromMaster: boolean; masterType?: string } => {
    const nameLower = (field.name || '').toLowerCase();
    const labelLower = (field.label || '').toLowerCase();

    const isClassField =
      nameLower.includes('kelas') ||
      nameLower.includes('class') ||
      nameLower.includes('rombel') ||
      nameLower.includes('tingkat') ||
      labelLower.includes('kelas') ||
      labelLower.includes('rombel') ||
      labelLower.includes('tingkat');

    const isMajorField =
      nameLower.includes('jurusan') ||
      nameLower.includes('major') ||
      nameLower.includes('keahlian') ||
      nameLower.includes('konsentrasi') ||
      nameLower.includes('prodi') ||
      labelLower.includes('jurusan') ||
      labelLower.includes('keahlian') ||
      labelLower.includes('konsentrasi') ||
      labelLower.includes('program keahlian');

    if (isClassField && currentSettings.classes && currentSettings.classes.length > 0) {
      return { options: currentSettings.classes, isFromMaster: true, masterType: 'Master Kelas Spreadsheet' };
    }

    if (isMajorField && currentSettings.majors && currentSettings.majors.length > 0) {
      return { options: currentSettings.majors, isFromMaster: true, masterType: 'Master Jurusan Spreadsheet' };
    }

    return { options: field.options || [], isFromMaster: false };
  };

  // Handle Field Changes
  const handleInputChange = (fieldName: string, value: any) => {
    const updated = { ...formData, [fieldName]: value };
    setFormData(updated);

    // Auto save draft
    localStorage.setItem(
      `tu_draft_${selectedType.id}`,
      JSON.stringify({ applicantName, applicantEmail, applicantPhone, applicantRole, formData: updated })
    );
  };

  const handleFileUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedFiles((prev) => ({
          ...prev,
          [fieldName]: { fileName: file.name, fileUrl: dataUrl, fileSize },
        }));
        handleInputChange(fieldName, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Captcha Validation
    if (parseInt(captchaInput, 10) !== num1 + num2) {
      setCaptchaError(true);
      setErrorMsg('Jawaban CAPTCHA tidak tepat. Silahkan hitung ulang.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const newReq = StorageService.createSubmission({
          letterTypeId: selectedType.id,
          letterTypeName: selectedType.name,
          applicantName,
          applicantEmail,
          applicantPhone,
          applicantRole,
          formData,
          uploadedFiles,
        });

        // Clear draft
        localStorage.removeItem(`tu_draft_${selectedType.id}`);

        setIsSubmitting(false);
        onSuccess(newReq);
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMsg('Gagal mengirimkan permohonan: ' + err.message);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 text-lg border border-white/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="bg-blue-800 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                KODE: {selectedType.code}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">{selectedType.name}</h2>
              <p className="text-xs text-blue-200">Estimasi Proses: {selectedType.processingTimeDays} Hari Kerja</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Data Identitas Pemohon */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">1</span>
                Identitas Pemohon
              </h3>
              <span className="text-xs text-slate-400">* Wajib Diisi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Pemohon *</label>
                <select
                  value={applicantRole}
                  onChange={(e: any) => setApplicantRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                  required
                >
                  <option value="siswa">Siswa Aktif Sekolah</option>
                  <option value="alumni">Alumni / Lulusan</option>
                  <option value="orang_tua">Orang Tua / Wali Siswa</option>
                  <option value="lainnya">Lainnya / Instansi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Pemohon *</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Nama sesuai akta / ijazah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Aktif Pemohon *</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="contoh@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor HP / WhatsApp Aktif *</label>
                <input
                  type="tel"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Form Isian Dinamis Sesuai Konfigurasi Admin */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">2</span>
                Formulir Rincian {selectedType.name}
              </h3>
              <span className="text-[11px] text-slate-500">Konfigurasi Form Builder Aktif</span>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Belum ada kolom khusus untuk surat ini. Silahkan isi data identitas di atas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field) => {
                  if (field.hidden) return null;
                  const value = formData[field.name] || field.defaultValue || '';
                  const { options, isFromMaster, masterType } = resolveFieldOptions(field);

                  return (
                    <div key={field.id} className={field.type === 'textarea' || field.type.startsWith('file_') ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {field.label} {field.required && <span className="text-rose-600">*</span>}
                      </label>

                      {/* TEXT / NUMBER / EMAIL / PHONE / DATE */}
                      {['text', 'number', 'email', 'phone', 'date'].includes(field.type) && (
                        <input
                          type={field.type === 'phone' ? 'tel' : field.type}
                          value={value}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required={field.required}
                        />
                      )}

                      {/* TEXTAREA */}
                      {field.type === 'textarea' && (
                        <textarea
                          rows={3}
                          value={value}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          required={field.required}
                        />
                      )}

                      {/* DROPDOWN */}
                      {field.type === 'dropdown' && (
                        <select
                          value={value}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                          required={field.required}
                        >
                          <option value="">-- Pilih {field.label} --</option>
                          {options.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* RADIO BUTTON */}
                      {field.type === 'radio' && (
                        <div className="flex flex-wrap gap-4 pt-1">
                          {options.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name={field.name}
                                value={opt}
                                checked={value === opt}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                className="text-blue-600 focus:ring-blue-500"
                                required={field.required}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* FILE UPLOADS */}
                      {field.type.startsWith('file_') && (
                        <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 hover:bg-blue-50/50 transition flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {uploadedFiles[field.name] ? uploadedFiles[field.name].fileName : 'Unggah File Lampiran'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {uploadedFiles[field.name]
                                  ? `Ukuran: ${uploadedFiles[field.name].fileSize}`
                                  : 'Format PDF, JPG, PNG (Maks 5 MB)'}
                              </p>
                            </div>
                          </div>

                          <label className="cursor-pointer bg-white border border-slate-300 hover:border-blue-600 text-slate-700 font-semibold px-3 py-1.5 rounded-xl text-xs transition shadow-2xs">
                            <span>Pilih File</span>
                            <input
                              type="file"
                              accept={field.type === 'file_pdf' ? '.pdf' : '.pdf,.png,.jpg,.jpeg,.doc,.docx'}
                              onChange={(e) => handleFileUpload(field.name, e)}
                              className="hidden"
                              required={field.required && !uploadedFiles[field.name]}
                            />
                          </label>
                        </div>
                      )}

                      {field.helpText && <p className="text-[11px] text-slate-500 mt-1">{field.helpText}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Keamanan Captcha */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Verifikasi Keamanan (Anti Spambot)</span>
            </h4>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-sm bg-blue-100 text-blue-900 px-3 py-1.5 rounded-lg">
                {num1} + {num2} = ?
              </span>
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  setCaptchaError(false);
                }}
                placeholder="Jawaban angka..."
                className={`w-36 px-3 py-1.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                  captchaError ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
                required
              />
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Mengirimkan Permohonan...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Permohonan Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
