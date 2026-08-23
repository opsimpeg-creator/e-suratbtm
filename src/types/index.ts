export type UserRole = 'super_admin' | 'admin_tu' | 'operator';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
}

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file_image'
  | 'file_pdf'
  | 'file_doc';

export interface FormField {
  id: string;
  letterTypeId: string;
  label: string;
  name: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // for dropdown, radio, checkbox
  order: number;
  hidden?: boolean;
  defaultValue?: string;
  validationRegex?: string;
}

export interface LetterType {
  id: string;
  code: string; // e.g., 'SKAS'
  name: string;
  description: string;
  processingTimeDays: number;
  iconName: string; // Lucide icon name
  color: string; // Tailwind color class or hex
  active: boolean;
  order: number;
  templateId?: string;
  fields?: FormField[];
}

export type RequestStatus = 'Menunggu' | 'Diproses' | 'Ditolak' | 'Selesai';

export interface RequestTimeline {
  status: RequestStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface SubmissionRequest {
  id: string; // internal ID
  requestNumber: string; // e.g., REQ-202608-001
  letterTypeId: string;
  letterTypeName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantRole: 'siswa' | 'alumni' | 'orang_tua' | 'lainnya';
  formData: Record<string, any>; // Keyed by field name or ID
  uploadedFiles?: Record<string, { fileName: string; fileUrl: string; fileSize?: string }>;
  status: RequestStatus;
  rejectionReason?: string;
  processingNote?: string;
  officialLetterNumber?: string; // e.g., 420/001/TU-SMK/2026
  officialLetterDate?: string;
  issuedDocumentUrl?: string; // Generated PDF or uploaded final PDF
  digitalSignatureApplied?: boolean;
  qrVerificationCode?: string;
  timeline: RequestTimeline[];
  createdAt: string;
  updatedAt: string;
}

export interface LetterTemplate {
  id: string;
  letterTypeId: string;
  title: string;
  headerTitle: string;
  headerSubTitle: string;
  headerAddress: string;
  contentHtml: string;
  footerTitle: string;
  showQrCode: boolean;
  showDigitalStamp: boolean;
  showDigitalSignature: boolean;
  updatedAt: string;
}

export interface OperatingHours {
  isRamadanMode: boolean;
  monThuHours: string;
  friHours: string;
  ramadanHours: string;
  ramadanNote?: string;
  generalNote?: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolSubTitle: string;
  schoolNPSN: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  headmasterName: string;
  headmasterNIP: string;
  tuHeadName: string;
  tuHeadNIP: string;
  logoUrl: string;
  digitalStampUrl?: string;
  digitalSignatureUrl?: string;
  letterNumberPattern: string; // e.g. 420/{SEQ}/TU-SMK/{YEAR}
  currentSeqNumber: number;
  themePrimaryColor: string;
  spreadsheetId: string;
  webAppUrl?: string;
  autoSync: boolean;
  emailNotificationsEnabled: boolean;
  waNotificationsEnabled: boolean;
  waAdminNumber: string;
  classes?: string[];
  majors?: string[];
  operatingHours?: OperatingHours;
  appScriptWebAppUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export type ComplaintStatus = 'Baru' | 'Sedang Ditangani' | 'Selesai';

export interface ComplaintTicket {
  id: string;
  ticketNumber: string; // e.g. TKT-202608-0001
  senderName: string;
  senderContact: string; // Email or WhatsApp/Phone
  category?: string;
  message: string;
  status: ComplaintStatus;
  adminResponse?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

