import {
  SchoolSettings,
  LetterType,
  FormField,
  SubmissionRequest,
  LetterTemplate,
  User,
  AuditLog,
  RequestStatus,
  ComplaintTicket,
  ComplaintStatus
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_LETTER_TYPES,
  INITIAL_FORM_FIELDS,
  INITIAL_TEMPLATES,
  INITIAL_SUBMISSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMPLAINTS
} from '../data/defaultData';
import {
  seedFirestoreIfEmpty,
  subscribeToFirebase,
  saveSettingsToFirebase,
  saveUserToFirebase,
  deleteUserFromFirebase,
  saveUsersListToFirebase,
  saveSubmissionToFirebase,
  deleteSubmissionFromFirebase,
  saveLetterTypeToFirebase,
  deleteLetterTypeFromFirebase,
  saveFormFieldsToFirebase,
  saveTemplateToFirebase,
  saveAuditLogToFirebase,
  saveComplaintToFirebase,
  deleteComplaintFromFirebase
} from './firebase';

const KEYS = {
  SETTINGS: 'tu_esurat_settings_v1',
  USERS: 'tu_esurat_users_v1',
  LETTER_TYPES: 'tu_esurat_letter_types_v1',
  FORM_FIELDS: 'tu_esurat_form_fields_v1',
  TEMPLATES: 'tu_esurat_templates_v1',
  SUBMISSIONS: 'tu_esurat_submissions_v1',
  AUDIT_LOGS: 'tu_esurat_audit_logs_v1',
  COMPLAINTS: 'tu_esurat_complaints_v1',
  CURRENT_USER: 'tu_esurat_current_user_v1',
};

// Helper to safely load from LocalStorage
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('tu_storage_updated', { detail: { key, value } }));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

// Storage API Engine
export const StorageService = {
  // Initialize Real-time Centralized Database (Firebase Firestore)
  initFirebase(onUpdate?: () => void): () => void {
    // Seed default data if database is fresh
    seedFirestoreIfEmpty().catch((err) => console.warn('Seed Firestore error:', err));

    // Subscribe to Firestore changes
    return subscribeToFirebase((data) => {
      if (data.settings) setStored(KEYS.SETTINGS, data.settings);
      if (data.users && data.users.length > 0) setStored(KEYS.USERS, data.users);
      if (data.letterTypes && data.letterTypes.length > 0) setStored(KEYS.LETTER_TYPES, data.letterTypes);
      if (data.formFields && data.formFields.length > 0) setStored(KEYS.FORM_FIELDS, data.formFields);
      if (data.templates && data.templates.length > 0) setStored(KEYS.TEMPLATES, data.templates);
      if (data.submissions) setStored(KEYS.SUBMISSIONS, data.submissions);
      if (data.auditLogs) setStored(KEYS.AUDIT_LOGS, data.auditLogs);
      if (data.complaints) setStored(KEYS.COMPLAINTS, data.complaints);

      if (onUpdate) onUpdate();
    });
  },

  // Settings
  getSettings(): SchoolSettings {
    const settings = getStored<SchoolSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
    let dirty = false;
    if (!settings.spreadsheetId || settings.spreadsheetId === '1buGZ0ySTwxfocJLbEic8eRfRk2R5_serZtdJUEvVZEs') {
      settings.spreadsheetId = '1lQ4BNn0l9Qjp06g-QS0ilD1I8-2nX4pK7a4qbRv34OI';
      dirty = true;
    }
    if (!settings.classes || settings.classes.length === 0) {
      settings.classes = INITIAL_SETTINGS.classes || ['X (Sepuluh)', 'XI (Sebelas)', 'XII (Dua Belas)', 'Alumni / Lulus'];
      dirty = true;
    }
    if (!settings.majors || settings.majors.length === 0) {
      settings.majors = INITIAL_SETTINGS.majors || [
        'Teknik Komputer & Jaringan (TKJ)',
        'Rekayasa Perangkat Lunak (RPL)',
        'Teknik Sepeda Motor (TSM)',
        'Akuntansi & Keuangan Lembaga (AKL)',
        'Desain Komunikasi Visual (DKV)'
      ];
      dirty = true;
    }
    if (!settings.operatingHours) {
      settings.operatingHours = INITIAL_SETTINGS.operatingHours || {
        isRamadanMode: false,
        monThuHours: '08.00 - 15.00 WITA',
        friHours: '08.00 - 11.30 WITA',
        ramadanHours: '08.00 - 13.00 WITA',
        ramadanNote: 'Khusus Selama Bulan Suci Ramadhan',
        generalNote: 'Sabtu, Minggu & Hari Libur Nasional Tutup'
      };
      dirty = true;
    }
    if (dirty) {
      setStored(KEYS.SETTINGS, settings);
    }
    return settings;
  },
  saveSettings(settings: SchoolSettings): void {
    setStored(KEYS.SETTINGS, settings);
    saveSettingsToFirebase(settings);

    // Background sync to Google Apps Script
    import('./appsScript').then(({ AppsScriptService }) => {
      AppsScriptService.sendNomorSuratToAppsScript(settings.letterNumberPattern, settings.currentSeqNumber).catch((err) => {
        console.warn('Sync settings/nomorSurat to Apps Script error:', err);
      });
    });
  },

  // Class Management Helpers
  addClass(className: string): boolean {
    if (!className.trim()) return false;
    const settings = this.getSettings();
    const list = settings.classes || [];
    if (list.includes(className.trim())) return false;
    settings.classes = [...list, className.trim()];
    this.saveSettings(settings);
    this.addAuditLog('super_admin', 'TAMBAH_KELAS', `Menambahkan master kelas baru: ${className}`);
    return true;
  },

  updateClass(oldName: string, newName: string): boolean {
    if (!newName.trim()) return false;
    const settings = this.getSettings();
    const list = settings.classes || [];
    const idx = list.indexOf(oldName);
    if (idx === -1) return false;
    list[idx] = newName.trim();
    settings.classes = [...list];
    this.saveSettings(settings);
    this.addAuditLog('super_admin', 'UBAH_KELAS', `Mengubah master kelas ${oldName} menjadi ${newName}`);
    return true;
  },

  deleteClass(className: string): boolean {
    const settings = this.getSettings();
    const list = settings.classes || [];
    const filtered = list.filter((c) => c !== className);
    if (filtered.length === list.length) return false;
    settings.classes = filtered;
    this.saveSettings(settings);
    this.addAuditLog('super_admin', 'HAPUS_KELAS', `Menghapus master kelas: ${className}`);
    return true;
  },

  // Major / Konsentrasi Keahlian Management Helpers
  addMajor(majorName: string): boolean {
    if (!majorName.trim()) return false;
    const settings = this.getSettings();
    const list = settings.majors || [];
    if (list.includes(majorName.trim())) return false;
    settings.majors = [...list, majorName.trim()];
    this.saveSettings(settings);
    this.addAuditLog('super_admin', 'TAMBAH_JURUSAN', `Menambahkan konsentrasi keahlian baru: ${majorName}`);
    return true;
  },

  updateMajor(oldName: string, newName: string): boolean {
    if (!newName.trim()) return false;
    const settings = this.getSettings();
    const list = settings.majors || [];
    const idx = list.indexOf(oldName);
    if (idx === -1) return false;
    list[idx] = newName.trim();
    settings.majors = [...list];
    this.saveSettings(settings);
    this.addAuditLog('super_admin', 'UBAH_JURUSAN', `Mengubah konsentrasi keahlian ${oldName} menjadi ${newName}`);
    return true;
  },

  deleteMajor(majorName: string): boolean {
    const settings = this.getSettings();
    const list = settings.majors || [];
    const filtered = list.filter((m) => m !== majorName);
    if (filtered.length === list.length) return false;
    settings.majors = filtered;
    this.saveSettings(settings);
    this.addAuditLog('super_admin', 'HAPUS_JURUSAN', `Menghapus konsentrasi keahlian: ${majorName}`);
    return true;
  },

  // Users
  getUsers(): User[] {
    const list = getStored<User[]>(KEYS.USERS, INITIAL_USERS);
    return list.map((u) => ({
      ...u,
      password: u.password || '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      status: u.status || 'active',
    }));
  },
  saveUsers(users: User[]): void {
    setStored(KEYS.USERS, users);
    saveUsersListToFirebase(users);
    import('./appsScript').then(({ AppsScriptService }) => {
      AppsScriptService.syncAllUsersToAppsScript().catch((err) => {
        console.warn('Apps Script sync users error:', err);
      });
    });
  },
  deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return false;
    const filtered = users.filter((u) => u.id !== userId);
    this.saveUsers(filtered);
    deleteUserFromFirebase(userId);
    this.addAuditLog('super_admin', 'DELETE_USER', `Menghapus akun pengguna: ${target.username} (${target.name})`);
    return true;
  },
  toggleUserStatus(userId: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      const newStatus = users[idx].status === 'inactive' ? 'active' : 'inactive';
      users[idx].status = newStatus;
      this.saveUsers(users);
      saveUserToFirebase(users[idx]);
      this.addAuditLog('super_admin', 'TOGGLE_USER_STATUS', `Mengubah status pengguna ${users[idx].username} menjadi: ${newStatus}`);
      return true;
    }
    return false;
  },
  updateUserPassword(userId: string, newPassword: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].password = newPassword;
      this.saveUsers(users);
      saveUserToFirebase(users[idx]);
      this.addAuditLog('super_admin', 'RESET_PASSWORD', `Mengubah password untuk pengguna: ${users[idx].username}`);
      return true;
    }
    return false;
  },
  getCurrentUser(): User | null {
    return getStored<User | null>(KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user: User | null): void {
    setStored(KEYS.CURRENT_USER, user);
  },

  // Letter Types
  getLetterTypes(): LetterType[] {
    return getStored<LetterType[]>(KEYS.LETTER_TYPES, INITIAL_LETTER_TYPES);
  },
  saveLetterTypes(types: LetterType[]): void {
    setStored(KEYS.LETTER_TYPES, types);
    types.forEach((t) => saveLetterTypeToFirebase(t));
  },
  addLetterType(newType: Omit<LetterType, 'id'>): LetterType {
    const types = this.getLetterTypes();
    const created: LetterType = {
      ...newType,
      id: 'lt-' + Date.now(),
    };
    types.push(created);
    this.saveLetterTypes(types);
    saveLetterTypeToFirebase(created);
    this.addAuditLog('super_admin', 'TAMBAH_JENIS_SURAT', `Menambahkan jenis surat baru: ${created.name}`);

    import('./appsScript').then(({ AppsScriptService }) => {
      AppsScriptService.sendLetterTypeToAppsScript(created).catch((err) => {
        console.warn('Apps Script send letter type error:', err);
      });
    });

    return created;
  },
  updateLetterType(id: string, updates: Partial<LetterType>): void {
    const types = this.getLetterTypes();
    const idx = types.findIndex((t) => t.id === id);
    if (idx !== -1) {
      types[idx] = { ...types[idx], ...updates };
      this.saveLetterTypes(types);
      saveLetterTypeToFirebase(types[idx]);
      this.addAuditLog('super_admin', 'EDIT_JENIS_SURAT', `Memperbarui jenis surat ID: ${id}`);

      import('./appsScript').then(({ AppsScriptService }) => {
        AppsScriptService.sendLetterTypeToAppsScript(types[idx]).catch((err) => {
          console.warn('Apps Script update letter type error:', err);
        });
      });
    }
  },
  deleteLetterType(id: string): void {
    const types = this.getLetterTypes().filter((t) => t.id !== id);
    this.saveLetterTypes(types);
    deleteLetterTypeFromFirebase(id);
    const fields = this.getFormFields().filter((f) => f.letterTypeId !== id);
    this.saveFormFields(fields);
    this.addAuditLog('super_admin', 'HAPUS_JENIS_SURAT', `Menghapus jenis surat ID: ${id}`);

    import('./appsScript').then(({ AppsScriptService }) => {
      AppsScriptService.syncAllLetterTypesToAppsScript().catch((err) => {
        console.warn('Apps Script sync letter types error:', err);
      });
    });
  },

  // Form Fields
  getFormFields(): FormField[] {
    return getStored<FormField[]>(KEYS.FORM_FIELDS, INITIAL_FORM_FIELDS);
  },
  getFieldsForLetterType(letterTypeId: string): FormField[] {
    const fields = this.getFormFields().filter((f) => f.letterTypeId === letterTypeId);
    return fields.sort((a, b) => a.order - b.order);
  },
  saveFormFields(fields: FormField[]): void {
    setStored(KEYS.FORM_FIELDS, fields);
    saveFormFieldsToFirebase(fields);
  },

  // Templates
  getTemplates(): LetterTemplate[] {
    return getStored<LetterTemplate[]>(KEYS.TEMPLATES, INITIAL_TEMPLATES);
  },
  getTemplateForLetterType(letterTypeId: string): LetterTemplate | undefined {
    return this.getTemplates().find((t) => t.letterTypeId === letterTypeId);
  },
  saveTemplate(template: LetterTemplate): void {
    const templates = this.getTemplates();
    const idx = templates.findIndex((t) => t.id === template.id || t.letterTypeId === template.letterTypeId);
    if (idx !== -1) {
      templates[idx] = template;
    } else {
      templates.push(template);
    }
    setStored(KEYS.TEMPLATES, templates);
    saveTemplateToFirebase(template);
    this.addAuditLog('admin_tu', 'UPDATE_TEMPLATE', `Memperbarui template surat ID: ${template.id}`);
  },

  // Submissions
  getSubmissions(): SubmissionRequest[] {
    return getStored<SubmissionRequest[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  },
  getSubmissionByNumber(requestNumber: string): SubmissionRequest | undefined {
    return this.getSubmissions().find(
      (s) => s.requestNumber.toLowerCase().trim() === requestNumber.toLowerCase().trim()
    );
  },
  getSubmissionByQr(qrCode: string): SubmissionRequest | undefined {
    return this.getSubmissions().find(
      (s) => (s.qrVerificationCode && s.qrVerificationCode === qrCode) || (s.officialLetterNumber && s.officialLetterNumber === qrCode)
    );
  },
  saveSubmissions(submissions: SubmissionRequest[]): void {
    setStored(KEYS.SUBMISSIONS, submissions);
    submissions.forEach((s) => saveSubmissionToFirebase(s));
  },
  deleteSubmission(id: string): boolean {
    const list = this.getSubmissions();
    const target = list.find((s) => s.id === id);
    if (!target) return false;
    const filtered = list.filter((s) => s.id !== id);
    setStored(KEYS.SUBMISSIONS, filtered);
    deleteSubmissionFromFirebase(id);
    this.addAuditLog('admin', 'DELETE_SUBMISSION', `Menghapus permohonan: ${target.requestNumber} (${target.applicantName})`);

    // Sync delete to Google Apps Script
    import('./appsScript').then(({ AppsScriptService }) => {
      AppsScriptService.deleteSubmissionFromAppsScript(id, target.requestNumber).catch((err) => {
        console.warn('Sync delete to Apps Script error:', err);
      });
    });
    return true;
  },
  clearAllSubmissions(): void {
    const list = this.getSubmissions();
    list.forEach((s) => deleteSubmissionFromFirebase(s.id));
    setStored(KEYS.SUBMISSIONS, []);
    this.addAuditLog('admin', 'CLEAR_SUBMISSIONS', 'Mengosongkan seluruh data permohonan di aplikasi lokal dan Firebase.');
  },

  createSubmission(data: {
    letterTypeId: string;
    letterTypeName: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    applicantRole: 'siswa' | 'alumni' | 'orang_tua' | 'lainnya';
    formData: Record<string, any>;
    uploadedFiles?: Record<string, { fileName: string; fileUrl: string; fileSize?: string }>;
  }): SubmissionRequest {
    const submissions = this.getSubmissions();
    const countToday = submissions.filter(s => s.createdAt.startsWith(new Date().toISOString().split('T')[0])).length + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(0, 6);
    const requestNumber = `SRT-${dateStr}-${String(countToday).padStart(4, '0')}`;

    const newRequest: SubmissionRequest = {
      id: 'sub-' + Date.now(),
      requestNumber,
      letterTypeId: data.letterTypeId,
      letterTypeName: data.letterTypeName,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      applicantPhone: data.applicantPhone,
      applicantRole: data.applicantRole,
      formData: data.formData,
      uploadedFiles: data.uploadedFiles,
      status: 'Menunggu',
      qrVerificationCode: `VERIF-${requestNumber}-${Math.floor(1000 + Math.random() * 9000)}`,
      timeline: [
        {
          status: 'Menunggu',
          timestamp: new Date().toISOString(),
          actor: `${data.applicantName} (Pemohon)`,
          note: 'Pengajuan permohonan berhasil terkirim ke sistem Tata Usaha.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    submissions.unshift(newRequest);
    setStored(KEYS.SUBMISSIONS, submissions);
    saveSubmissionToFirebase(newRequest);
    this.addAuditLog('Sistem', 'AJUKAN_SURAT', `Pengajuan surat baru: ${requestNumber} (${data.applicantName})`);

    // Otomatis kirim ke Google Apps Script Web App jika URL terkonfigurasi
    import('./appsScript').then(({ AppsScriptService }) => {
      AppsScriptService.sendSubmissionToAppsScript(newRequest).catch((err) => {
        console.warn('Apps Script sync background:', err);
      });
    });

    return newRequest;
  },

  updateRequestStatus(
    id: string,
    newStatus: RequestStatus,
    actorName: string,
    note?: string,
    rejectionReason?: string,
    officialLetterNumber?: string,
    officialLetterDate?: string,
    issuedDocumentUrl?: string
  ): SubmissionRequest | undefined {
    const submissions = this.getSubmissions();
    const idx = submissions.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    const req = submissions[idx];
    req.status = newStatus;
    req.updatedAt = new Date().toISOString();
    if (rejectionReason) req.rejectionReason = rejectionReason;
    if (note) req.processingNote = note;
    if (officialLetterNumber) req.officialLetterNumber = officialLetterNumber;
    if (officialLetterDate) req.officialLetterDate = officialLetterDate;
    if (issuedDocumentUrl !== undefined) req.issuedDocumentUrl = issuedDocumentUrl;
    if (newStatus === 'Selesai') {
      req.digitalSignatureApplied = true;
    }

    req.timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      actor: actorName,
      note: note || (newStatus === 'Ditolak' ? rejectionReason : `Status diperbarui menjadi ${newStatus}`),
    });

    submissions[idx] = req;
    setStored(KEYS.SUBMISSIONS, submissions);
    saveSubmissionToFirebase(req);

    this.addAuditLog(actorName, 'UPDATE_STATUS_SURAT', `Status permohonan ${req.requestNumber} diubah ke ${newStatus}`);

    // Update status di Google Spreadsheet
    import('./appsScript').then(({ AppsScriptService }) => {
      AppsScriptService.updateStatusInAppsScript(req.requestNumber, newStatus, actorName, officialLetterNumber, issuedDocumentUrl).catch((err) => {
        console.warn('Apps Script update status background:', err);
      });
    });

    return req;
  },

  // Auto Letter Number Sequence Generator
  generateNextOfficialLetterNumber(): string {
    const settings = this.getSettings();
    const currentYear = new Date().getFullYear();
    const seq = settings.currentSeqNumber || 1;
    const formattedSeq = String(seq).padStart(3, '0');

    // Pattern: 420/{SEQ}/TU-SMK/{YEAR}
    let number = settings.letterNumberPattern || '420/{SEQ}/TU-SMK/{YEAR}';
    number = number.replace('{SEQ}', formattedSeq).replace('{YEAR}', String(currentYear));

    // Update sequence
    settings.currentSeqNumber = seq + 1;
    this.saveSettings(settings);

    return number;
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  addAuditLog(actor: string, action: string, details: string): void {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      username: user ? user.username : actor,
      userRole: user ? user.role : 'System',
      action,
      details,
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.length = 100;
    setStored(KEYS.AUDIT_LOGS, logs);
    saveAuditLogToFirebase(newLog);
  },

  // Complaints / Helpdesk Tickets API
  getComplaints(): ComplaintTicket[] {
    return getStored<ComplaintTicket[]>(KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  },

  saveComplaints(complaints: ComplaintTicket[]): void {
    setStored(KEYS.COMPLAINTS, complaints);
  },

  getComplaintById(id: string): ComplaintTicket | undefined {
    const list = this.getComplaints();
    return list.find((c) => c.id === id);
  },

  getComplaintByTicketNumber(ticketNumber: string): ComplaintTicket | undefined {
    const clean = ticketNumber.trim().toUpperCase();
    const list = this.getComplaints();
    return list.find((c) => c.ticketNumber.toUpperCase() === clean);
  },

  generateNextTicketNumber(): string {
    const list = this.getComplaints();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `TKT-${yearMonth}-`;
    const matching = list.filter((c) => c.ticketNumber && c.ticketNumber.startsWith(prefix));
    const nextIndex = matching.length + 1;
    return `${prefix}${String(nextIndex).padStart(4, '0')}`;
  },

  createComplaint(data: {
    senderName: string;
    senderContact: string;
    message: string;
    category?: string;
  }): ComplaintTicket {
    const list = this.getComplaints();
    const ticketNumber = this.generateNextTicketNumber();
    const now = new Date().toISOString();

    const newTicket: ComplaintTicket = {
      id: 'tkt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      ticketNumber,
      senderName: data.senderName.trim(),
      senderContact: data.senderContact.trim(),
      message: data.message.trim(),
      category: data.category || 'Kendala / Pertanyaan Umum',
      status: 'Baru',
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newTicket, ...list];
    this.saveComplaints(updated);
    saveComplaintToFirebase(newTicket);

    this.addAuditLog('System', 'CREATE_COMPLAINT', `Pengaduan baru diterima: ${ticketNumber} dari ${newTicket.senderName}`);
    return newTicket;
  },

  updateComplaintResponse(
    ticketId: string,
    adminResponse: string,
    status: ComplaintStatus,
    actorName: string = 'Staf TU Admin'
  ): boolean {
    const list = this.getComplaints();
    const idx = list.findIndex((c) => c.id === ticketId);
    if (idx === -1) return false;

    const now = new Date().toISOString();
    const updatedTicket: ComplaintTicket = {
      ...list[idx],
      adminResponse: adminResponse.trim(),
      status,
      respondedAt: now,
      respondedBy: actorName,
      updatedAt: now,
    };

    list[idx] = updatedTicket;
    this.saveComplaints(list);
    saveComplaintToFirebase(updatedTicket);

    this.addAuditLog(
      actorName,
      'RESPOND_COMPLAINT',
      `Menanggapi pengaduan ${updatedTicket.ticketNumber} (Status: ${status})`
    );
    return true;
  },

  deleteComplaint(ticketId: string): boolean {
    const list = this.getComplaints();
    const target = list.find((c) => c.id === ticketId);
    if (!target) return false;

    const filtered = list.filter((c) => c.id !== ticketId);
    this.saveComplaints(filtered);
    deleteComplaintFromFirebase(ticketId);

    this.addAuditLog(
      'Staf TU Admin',
      'DELETE_COMPLAINT',
      `Menghapus data tiket pengaduan ${target.ticketNumber} (${target.senderName})`
    );
    return true;
  },

  clearAllComplaints(): void {
    const list = this.getComplaints();
    this.saveComplaints([]);
    list.forEach((c) => deleteComplaintFromFirebase(c.id));
    this.addAuditLog('super_admin', 'CLEAR_COMPLAINTS', 'Mengosongkan seluruh data pengaduan.');
  },

  // Export / Import / Reset Database
  exportBackupJSON(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      users: this.getUsers(),
      letterTypes: this.getLetterTypes(),
      formFields: this.getFormFields(),
      templates: this.getTemplates(),
      submissions: this.getSubmissions(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) this.saveSettings(data.settings);
      if (data.users) this.saveUsers(data.users);
      if (data.letterTypes) this.saveLetterTypes(data.letterTypes);
      if (data.formFields) this.saveFormFields(data.formFields);
      if (data.templates) {
        setStored(KEYS.TEMPLATES, data.templates);
        data.templates.forEach((t: LetterTemplate) => saveTemplateToFirebase(t));
      }
      if (data.submissions) this.saveSubmissions(data.submissions);
      if (data.auditLogs) {
        setStored(KEYS.AUDIT_LOGS, data.auditLogs);
        data.auditLogs.forEach((l: AuditLog) => saveAuditLogToFirebase(l));
      }
      this.addAuditLog('super_admin', 'RESTORE_DATABASE', 'Memulihkan database dari file cadangan JSON.');
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON:', e);
      return false;
    }
  },

  resetToFactory(): void {
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.LETTER_TYPES);
    localStorage.removeItem(KEYS.FORM_FIELDS);
    localStorage.removeItem(KEYS.TEMPLATES);
    localStorage.removeItem(KEYS.SUBMISSIONS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.CURRENT_USER);
  },
};
