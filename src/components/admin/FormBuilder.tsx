import React, { useState } from 'react';
import { LetterType, FormField, FieldType } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Sliders,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Type,
  List,
  Upload,
  Calendar,
  Eye,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface FormBuilderProps {
  letterTypes: LetterType[];
  selectedLetterType: LetterType | null;
  onRefresh: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  letterTypes,
  selectedLetterType,
  onRefresh,
}) => {
  const [currentTypeId, setCurrentTypeId] = useState<string>(
    selectedLetterType ? selectedLetterType.id : letterTypes[0]?.id || ''
  );

  const fields = StorageService.getFieldsForLetterType(currentTypeId);
  const settings = StorageService.getSettings();

  // New/Edit Field State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [required, setRequired] = useState(true);
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [optionsText, setOptionsText] = useState(''); // comma-separated
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeLetterType = letterTypes.find((t) => t.id === currentTypeId);

  const resetFieldForm = () => {
    setEditingFieldId(null);
    setLabel('');
    setName('');
    setFieldType('text');
    setRequired(true);
    setPlaceholder('');
    setHelpText('');
    setOptionsText('');
  };

  const handleEditFieldClick = (f: FormField) => {
    setEditingFieldId(f.id);
    setLabel(f.label);
    setName(f.name);
    setFieldType(f.type);
    setRequired(f.required);
    setPlaceholder(f.placeholder || '');
    setHelpText(f.helpText || '');
    setOptionsText(f.options ? f.options.join(', ') : '');
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const allFields = StorageService.getFormFields();
      const parsedOptions = ['dropdown', 'radio', 'checkbox'].includes(fieldType)
        ? optionsText
            .split(/[\n,]+/)
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

      const fieldNameKey = name.trim() ? name.trim().toLowerCase().replace(/\s+/g, '_') : label.toLowerCase().replace(/[^a-z0-9]/g, '_');

      let targetField: FormField;

      if (editingFieldId) {
        const idx = allFields.findIndex((f) => f.id === editingFieldId);
        targetField = {
          ...(allFields[idx] || {}),
          id: editingFieldId,
          letterTypeId: currentTypeId,
          label,
          name: fieldNameKey,
          type: fieldType,
          required,
          placeholder: placeholder.trim() || undefined,
          helpText: helpText.trim() || undefined,
          options: parsedOptions,
          order: allFields[idx]?.order || 1,
        };
        if (idx !== -1) {
          allFields[idx] = targetField;
        }
      } else {
        targetField = {
          id: 'f-' + Date.now(),
          letterTypeId: currentTypeId,
          label,
          name: fieldNameKey,
          type: fieldType,
          required,
          placeholder: placeholder.trim() || undefined,
          helpText: helpText.trim() || undefined,
          options: parsedOptions,
          order: fields.length + 1,
        };
        allFields.push(targetField);
      }

      await StorageService.saveSingleFormField(targetField);
      await StorageService.saveFormFields(allFields);

      onRefresh();
      resetFieldForm();
      setSaveSuccessNotice('Konfigurasi kolom formulir berhasil disimpan permanen ke Cloud Firestore!');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Error saving form field:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await StorageService.deleteFormField(fieldId);
      const allFields = StorageService.getFormFields().filter((f) => f.id !== fieldId);
      await StorageService.saveFormFields(allFields);
      onRefresh();
      setSaveSuccessNotice('Kolom berhasil dihapus dari Cloud Firestore');
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateField = async (f: FormField) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const allFields = StorageService.getFormFields();
      const dup: FormField = {
        ...f,
        id: 'f-' + Date.now(),
        label: f.label + ' (Salinan)',
        name: f.name + '_copy',
        order: fields.length + 1,
      };
      allFields.push(dup);
      await StorageService.saveSingleFormField(dup);
      await StorageService.saveFormFields(allFields);
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveOrder = async (idx: number, direction: 'up' | 'down') => {
    const currentFields = [...fields];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentFields.length || isSaving) return;

    // Swap order
    const tempOrder = currentFields[idx].order;
    currentFields[idx].order = currentFields[targetIdx].order;
    currentFields[targetIdx].order = tempOrder;

    const allFields = StorageService.getFormFields();
    currentFields.forEach((cf) => {
      const i = allFields.findIndex((f) => f.id === cf.id);
      if (i !== -1) allFields[i] = cf;
    });

    setIsSaving(true);
    try {
      await StorageService.saveFormFields(allFields);
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncAllFieldsNow = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const allFields = StorageService.getFormFields();
      await StorageService.saveFormFields(allFields);
      onRefresh();
      setSaveSuccessNotice('Seluruh kolom formulir berhasil disinkronkan ke Cloud Firestore!');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const fillMasterClasses = () => {
    const currentSettings = StorageService.getSettings();
    if (currentSettings.classes && currentSettings.classes.length > 0) {
      setOptionsText(currentSettings.classes.join(', '));
      if (!label) setLabel('Kelas');
      if (!name) setName('kelas');
      setFieldType('dropdown');
    }
  };

  const fillMasterMajors = () => {
    const currentSettings = StorageService.getSettings();
    if (currentSettings.majors && currentSettings.majors.length > 0) {
      setOptionsText(currentSettings.majors.join(', '));
      if (!label) setLabel('Konsentrasi Keahlian / Jurusan');
      if (!name) setName('jurusan');
      setFieldType('dropdown');
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Notice */}
      {saveSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Cloud Firestore Synchronized</span>
        </div>
      )}

      {/* Header Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Fitur Form Builder No-Code</span>
          <h2 className="text-xl font-extrabold text-slate-900">Perancang Formulir Dinamis</h2>
          <p className="text-xs text-slate-500">
            Tambah, edit, dan perbaharui opsi kolom isian formulir surat resmi secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Pilih Jenis Surat:</label>
          <select
            value={currentTypeId}
            onChange={(e) => {
              setCurrentTypeId(e.target.value);
              resetFieldForm();
            }}
            className="px-4 py-2.5 rounded-xl border border-blue-300 font-bold text-xs bg-blue-50 text-blue-900 focus:outline-none"
          >
            {letterTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add / Edit Field Form Box */}
          <form onSubmit={handleSaveField} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingFieldId ? 'Edit Kolom Formulir' : 'Tambah Kolom Formulir Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Untuk: <strong className="text-blue-700">{activeLetterType?.name}</strong>
                </p>
              </div>
              {editingFieldId && (
                <button type="button" onClick={resetFieldForm} className="text-slate-500 hover:text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl">
                  + Buat Baru
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Label Kolom *</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Contoh: Kelas / Jurusan / NISN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Input *</label>
                <select
                  value={fieldType}
                  onChange={(e: any) => setFieldType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-blue-900"
                >
                  <option value="text">Teks Singkat (Text)</option>
                  <option value="textarea">Teks Panjang (Textarea)</option>
                  <option value="number">Angka (Number)</option>
                  <option value="email">Email</option>
                  <option value="phone">Nomor HP / WhatsApp</option>
                  <option value="date">Tanggal (Date)</option>
                  <option value="dropdown">Pilihan Dropdown (Menu Tarik)</option>
                  <option value="radio">Radio Button (Satu Pilihan)</option>
                  <option value="checkbox">Checkbox (Banyak Pilihan)</option>
                  <option value="file_pdf">Upload File PDF</option>
                  <option value="file_image">Upload Foto / Gambar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Placeholder (Teks Petunjuk)</label>
                <input
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="Contoh: Pilih salah satu atau isi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pesan Bantuan (Help Text)</label>
                <input
                  type="text"
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                  placeholder="Contoh: Sesuai data rapor / kartu pelajar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {['dropdown', 'radio', 'checkbox'].includes(fieldType) && (
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block font-bold text-slate-700">
                      Opsi Pilihan (Pisahkan dengan Tanda Koma) *
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={fillMasterClasses}
                        className="text-[11px] bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold px-2.5 py-1 rounded-lg border border-blue-200 transition flex items-center gap-1"
                        title="Salin daftar kelas dari Setting Sekolah"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        Gunakan Master Kelas
                      </button>
                      <button
                        type="button"
                        onClick={fillMasterMajors}
                        className="text-[11px] bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center gap-1"
                        title="Salin daftar jurusan dari Setting Sekolah"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Gunakan Master Jurusan
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Contoh: X (Sepuluh), X-A (Sepuluh A), X-B (Sepuluh B), XI (Sebelas)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50/50 text-xs font-mono leading-relaxed"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Tips: Masukkan setiap pilihan dipisahkan tanda koma <code>,</code>. Contoh: <code>Opsi 1, Opsi 2, Opsi 3</code>
                  </p>
                </div>
              )}

              <div className="sm:col-span-2 flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                  <span>Wajib Diisi oleh Pemohon (Required)</span>
                </label>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingFieldId ? 'Simpan Perubahan' : 'Tambah Kolom'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Configured Fields Drag/Reorder List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Daftar Kolom Isian ({fields.length} Kolom)
                </h3>
                <p className="text-xs text-slate-400 font-normal">Gunakan panah untuk mengatur urutan</p>
              </div>
              <button
                type="button"
                onClick={handleSyncAllFieldsNow}
                disabled={isSaving}
                className="text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5 self-start sm:self-auto"
                title="Kunci & sinkronkan semua kolom ke Cloud Firestore"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Sinkronkan ke Cloud</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-blue-300 transition"
                >
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900">{f.label}</h4>
                          {f.required && <span className="text-rose-600 font-bold">*</span>}
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {f.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">key: {f.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-600 hover:text-blue-700 disabled:opacity-30"
                        title="Naikkan Urutan"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === fields.length - 1}
                        className="p-1.5 text-slate-600 hover:text-blue-700 disabled:opacity-30"
                        title="Turunkan Urutan"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateField(f)}
                        className="p-1.5 text-slate-600 hover:text-blue-700"
                        title="Duplikat Kolom"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditFieldClick(f)}
                        className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteField(f.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg"
                        title="Hapus Kolom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* If dropdown/radio/checkbox, display options pills */}
                  {f.options && f.options.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Opsi ({f.options.length}):</span>
                      {f.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="bg-white border border-slate-200 text-slate-700 text-[11px] px-2 py-0.5 rounded-md font-medium"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Form Preview */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl sticky top-24 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Pratinjau Tampilan Form</h3>
              </div>
              <span className="text-[10px] bg-blue-900 text-blue-200 font-bold px-2 py-0.5 rounded-full">
                LIVE PREVIEW
              </span>
            </div>

            <div className="space-y-4 text-xs text-slate-200 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-slate-300">
                <p className="font-bold text-white text-sm">{activeLetterType?.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Kode Surat: {activeLetterType?.code}</p>
              </div>

              {fields.length === 0 ? (
                <p className="text-slate-500 italic text-center py-8">Belum ada kolom yang dibuat.</p>
              ) : (
                fields.map((f) => (
                  <div key={f.id} className="space-y-1">
                    <label className="block font-bold text-slate-300">
                      {f.label} {f.required && <span className="text-rose-400">*</span>}
                    </label>

                    {['text', 'number', 'email', 'phone', 'date'].includes(f.type) && (
                      <input
                        type="text"
                        placeholder={f.placeholder || f.label}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        disabled
                      />
                    )}

                    {f.type === 'textarea' && (
                      <textarea
                        rows={2}
                        placeholder={f.placeholder || ''}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        disabled
                      />
                    )}

                    {f.type === 'dropdown' && (
                      <select className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white" disabled>
                        <option>-- Pilih {f.label} --</option>
                        {f.options?.map((o, i) => (
                          <option key={i}>{o}</option>
                        ))}
                      </select>
                    )}

                    {f.type === 'radio' && (
                      <div className="space-y-1.5 pt-1">
                        {f.options?.map((o, i) => (
                          <label key={i} className="flex items-center gap-2 text-slate-300 text-xs cursor-default">
                            <input type="radio" disabled className="w-3.5 h-3.5" />
                            <span>{o}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {f.type === 'checkbox' && (
                      <div className="space-y-1.5 pt-1">
                        {f.options?.map((o, i) => (
                          <label key={i} className="flex items-center gap-2 text-slate-300 text-xs cursor-default">
                            <input type="checkbox" disabled className="w-3.5 h-3.5" />
                            <span>{o}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {f.type.startsWith('file_') && (
                      <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-between">
                        <span className="text-slate-400">Pilih File...</span>
                        <Upload className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
