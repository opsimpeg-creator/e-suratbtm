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
  AlertCircle
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

  // New/Edit Field State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [required, setRequired] = useState(true);
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [optionsText, setOptionsText] = useState(''); // comma-separated

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

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const allFields = StorageService.getFormFields();
    const parsedOptions = ['dropdown', 'radio', 'checkbox'].includes(fieldType)
      ? optionsText.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    const fieldNameKey = name.trim() ? name.trim().toLowerCase().replace(/\s+/g, '_') : label.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (editingFieldId) {
      const idx = allFields.findIndex((f) => f.id === editingFieldId);
      if (idx !== -1) {
        allFields[idx] = {
          ...allFields[idx],
          label,
          name: fieldNameKey,
          type: fieldType,
          required,
          placeholder,
          helpText,
          options: parsedOptions,
        };
      }
    } else {
      const newField: FormField = {
        id: 'f-' + Date.now(),
        letterTypeId: currentTypeId,
        label,
        name: fieldNameKey,
        type: fieldType,
        required,
        placeholder,
        helpText,
        options: parsedOptions,
        order: fields.length + 1,
      };
      allFields.push(newField);
    }

    StorageService.saveFormFields(allFields);
    onRefresh();
    resetFieldForm();
  };

  const handleDeleteField = (fieldId: string) => {
    const allFields = StorageService.getFormFields().filter((f) => f.id !== fieldId);
    StorageService.saveFormFields(allFields);
    onRefresh();
  };

  const handleDuplicateField = (f: FormField) => {
    const allFields = StorageService.getFormFields();
    const dup: FormField = {
      ...f,
      id: 'f-' + Date.now(),
      label: f.label + ' (Salinan)',
      name: f.name + '_copy',
      order: fields.length + 1,
    };
    allFields.push(dup);
    StorageService.saveFormFields(allFields);
    onRefresh();
  };

  const handleMoveOrder = (idx: number, direction: 'up' | 'down') => {
    const currentFields = [...fields];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentFields.length) return;

    // Swap order
    const tempOrder = currentFields[idx].order;
    currentFields[idx].order = currentFields[targetIdx].order;
    currentFields[targetIdx].order = tempOrder;

    const allFields = StorageService.getFormFields();
    currentFields.forEach((cf) => {
      const i = allFields.findIndex((f) => f.id === cf.id);
      if (i !== -1) allFields[i] = cf;
    });

    StorageService.saveFormFields(allFields);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Fitur Google Form Builder</span>
          <h2 className="text-xl font-extrabold text-slate-900">Perancang Formulir Dinamis</h2>
          <p className="text-xs text-slate-500">
            Tambah dan susun kolom isian secara visual tanpa perlu menulis kode (No-code).
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
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-3 flex items-center justify-between">
              <span>{editingFieldId ? 'Edit Kolom Formulir' : 'Tambah Kolom Formulir Baru'}</span>
              {editingFieldId && (
                <button type="button" onClick={resetFieldForm} className="text-slate-500 hover:text-slate-800 font-normal">
                  + Buat Baru
                </button>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Label Kolom *</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Contoh: Nomor NISN Siswa"
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
                  <option value="dropdown">Pilihan Dropdown</option>
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
                  placeholder="Contoh: Masukkan 10 digit NISN..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pesan Bantuan (Help Text)</label>
                <input
                  type="text"
                  value={helpText}
                  onChange={(e) => setHelpText(e.target.value)}
                  placeholder="Contoh: Sesuai dengan kartu NISN aktif"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {['dropdown', 'radio', 'checkbox'].includes(fieldType) && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Opsi Pilihan (Pisahkan dengan Tanda Koma) *
                  </label>
                  <input
                    type="text"
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Contoh: Kelas X, Kelas XI, Kelas XII"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50/50"
                    required
                  />
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
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingFieldId ? 'Simpan Perubahan' : 'Tambah Kolom'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Configured Fields Drag/Reorder List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-3 flex items-center justify-between">
              <span>Daftar Kolom Isian ({fields.length} Kolom)</span>
              <span className="text-xs text-slate-400 font-normal">Gunakan panah untuk mengatur urutan</span>
            </h3>

            <div className="space-y-3">
              {fields.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 text-xs hover:border-blue-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{f.label}</h4>
                        {f.required && <span className="text-rose-600 font-bold">*</span>}
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {f.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">key: {f.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
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
