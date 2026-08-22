import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  deleteDoc,
  writeBatch,
  disableNetwork,
  enableNetwork,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  SchoolSettings,
  User,
  LetterType,
  FormField,
  LetterTemplate,
  SubmissionRequest,
  AuditLog,
  ComplaintTicket
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

// Silence Firestore internal log warnings (e.g. quota backoff spam)
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore
}

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection References
export const COLLECTIONS = {
  SETTINGS: 'settings',
  USERS: 'users',
  LETTER_TYPES: 'letterTypes',
  FORM_FIELDS: 'formFields',
  TEMPLATES: 'templates',
  SUBMISSIONS: 'submissions',
  AUDIT_LOGS: 'auditLogs',
  COMPLAINTS: 'complaints',
};

// Helper to recursively strip `undefined` properties for Firestore compatibility
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(data));
}

// Track Firestore quota/availability state in memory
let isQuotaExceeded = false;
let quotaExceededResetTimeout: any = null;

function handleFirestoreError(actionName: string, err: any) {
  const errMsg = err?.message || String(err);
  if (errMsg.includes('quota') || errMsg.includes('resource-exhausted') || err?.code === 'resource-exhausted') {
    isQuotaExceeded = true;
    console.warn(`Firestore quota reached during ${actionName}. Running in local offline storage mode.`);
    
    // Disable network so Firestore stops backoff retry loop in the background
    disableNetwork(db).catch(() => {});

    if (!quotaExceededResetTimeout) {
      // Re-enable attempts after 10 minutes
      quotaExceededResetTimeout = setTimeout(() => {
        isQuotaExceeded = false;
        quotaExceededResetTimeout = null;
        enableNetwork(db).catch(() => {});
      }, 10 * 60 * 1000);
    }
  } else {
    console.warn(`Firestore notice for ${actionName}:`, errMsg);
  }
}

// Seed Firestore with default data if empty (guarded with local storage check to avoid repeated quota writes)
export async function seedFirestoreIfEmpty(): Promise<void> {
  const SEED_FLAG_KEY = 'tu_firestore_seeded_flag_v1';
  try {
    if (localStorage.getItem(SEED_FLAG_KEY) === 'true') {
      return;
    }
    if (isQuotaExceeded) {
      return;
    }

    // Check if settings exist
    const settingsDocRef = doc(db, COLLECTIONS.SETTINGS, 'global');
    const settingsSnap = await getDoc(settingsDocRef);

    if (!settingsSnap.exists()) {
      console.log('Seeding initial data to Firebase Firestore...');
      const batch = writeBatch(db);

      // Seed settings
      batch.set(settingsDocRef, cleanForFirestore(INITIAL_SETTINGS));

      // Seed users
      INITIAL_USERS.forEach((u) => {
        batch.set(doc(db, COLLECTIONS.USERS, u.id), cleanForFirestore(u));
      });

      // Seed letter types
      INITIAL_LETTER_TYPES.forEach((lt) => {
        batch.set(doc(db, COLLECTIONS.LETTER_TYPES, lt.id), cleanForFirestore(lt));
      });

      // Seed form fields
      INITIAL_FORM_FIELDS.forEach((ff) => {
        batch.set(doc(db, COLLECTIONS.FORM_FIELDS, ff.id), cleanForFirestore(ff));
      });

      // Seed templates
      INITIAL_TEMPLATES.forEach((tmpl) => {
        batch.set(doc(db, COLLECTIONS.TEMPLATES, tmpl.id), cleanForFirestore(tmpl));
      });

      // Seed submissions
      INITIAL_SUBMISSIONS.forEach((sub) => {
        batch.set(doc(db, COLLECTIONS.SUBMISSIONS, sub.id), cleanForFirestore(sub));
      });

      // Seed audit logs
      INITIAL_AUDIT_LOGS.forEach((log) => {
        batch.set(doc(db, COLLECTIONS.AUDIT_LOGS, log.id), cleanForFirestore(log));
      });

      await batch.commit();
      console.log('Firestore seeding completed successfully.');
    }
    localStorage.setItem(SEED_FLAG_KEY, 'true');
  } catch (err: any) {
    handleFirestoreError('seedFirestoreIfEmpty', err);
    // Mark as seeded in local storage so it doesn't loop on every page reload
    localStorage.setItem(SEED_FLAG_KEY, 'true');
  }
}

export function isDummySubmission(s: any): boolean {
  if (!s || typeof s !== 'object') return true;
  const dummyIds = new Set([
    'sub-001',
    'sub-002',
    'sub-003',
    'sub-004',
    'demo-sample-001',
    'demo-sample-002',
    'demo-sample-003',
    'demo-sample-004',
  ]);
  if (s.id && dummyIds.has(String(s.id))) return true;
  return false;
}

export function isDummyComplaint(c: any): boolean {
  if (!c || typeof c !== 'object') return true;
  const dummyIds = new Set(['tkt-001', 'tkt-002']);
  if (c.id && dummyIds.has(String(c.id))) return true;
  return false;
}

// Subscribe to real-time updates for collections (granular updates to avoid data races)
export function subscribeToFirebase(callback: (data: Partial<{
  settings: SchoolSettings;
  users: User[];
  letterTypes: LetterType[];
  formFields: FormField[];
  templates: LetterTemplate[];
  submissions: SubmissionRequest[];
  auditLogs: AuditLog[];
  complaints?: ComplaintTicket[];
}>) => void): () => void {
  const handleSnapshotError = (collectionName: string) => (err: any) => {
    console.warn(`Firestore snapshot notice for ${collectionName}:`, err?.message || 'operating in local/offline fallback mode');
  };

  const unsubSettings = onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, 'global'),
    (snap) => {
      if (snap.exists()) {
        callback({ settings: snap.data() as SchoolSettings });
      }
    },
    handleSnapshotError('settings')
  );

  const unsubUsers = onSnapshot(
    collection(db, COLLECTIONS.USERS),
    (snap) => {
      if (!snap.empty) {
        const users = snap.docs.map((d) => d.data() as User);
        callback({ users });
      }
    },
    handleSnapshotError('users')
  );

  const unsubLetterTypes = onSnapshot(
    collection(db, COLLECTIONS.LETTER_TYPES),
    (snap) => {
      if (!snap.empty) {
        const letterTypes = snap.docs.map((d) => d.data() as LetterType);
        callback({ letterTypes });
      }
    },
    handleSnapshotError('letterTypes')
  );

  const unsubFormFields = onSnapshot(
    collection(db, COLLECTIONS.FORM_FIELDS),
    (snap) => {
      if (!snap.empty) {
        const formFields = snap.docs.map((d) => d.data() as FormField);
        callback({ formFields });
      }
    },
    handleSnapshotError('formFields')
  );

  const unsubTemplates = onSnapshot(
    collection(db, COLLECTIONS.TEMPLATES),
    (snap) => {
      if (!snap.empty) {
        const templates = snap.docs.map((d) => d.data() as LetterTemplate);
        callback({ templates });
      }
    },
    handleSnapshotError('templates')
  );

  const unsubSubmissions = onSnapshot(
    collection(db, COLLECTIONS.SUBMISSIONS),
    (snap) => {
      // Filter out any legacy dummy submissions from cloud snapshot
      const rawList = snap.docs.map((d) => d.data() as SubmissionRequest);
      const realOnly = rawList.filter((s) => !isDummySubmission(s));

      // Auto-cleanup dummy documents from Firestore if they exist
      snap.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (isDummySubmission({ id: docSnapshot.id, ...data })) {
          deleteDoc(doc(db, COLLECTIONS.SUBMISSIONS, docSnapshot.id)).catch(() => {});
        }
      });

      realOnly.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback({ submissions: realOnly });
    },
    handleSnapshotError('submissions')
  );

  const unsubAuditLogs = onSnapshot(
    collection(db, COLLECTIONS.AUDIT_LOGS),
    (snap) => {
      const auditLogs = snap.docs.map((d) => d.data() as AuditLog);
      auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback({ auditLogs });
    },
    handleSnapshotError('auditLogs')
  );

  const unsubComplaints = onSnapshot(
    collection(db, COLLECTIONS.COMPLAINTS),
    (snap) => {
      const rawList = snap.docs.map((d) => d.data() as ComplaintTicket);
      const realOnly = rawList.filter((c) => !isDummyComplaint(c));

      // Auto-cleanup dummy documents from Firestore if they exist
      snap.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (isDummyComplaint({ id: docSnapshot.id, ...data })) {
          deleteDoc(doc(db, COLLECTIONS.COMPLAINTS, docSnapshot.id)).catch(() => {});
        }
      });

      realOnly.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback({ complaints: realOnly });
    },
    handleSnapshotError('complaints')
  );

  // Return unsubscribe function
  return () => {
    unsubSettings();
    unsubUsers();
    unsubLetterTypes();
    unsubFormFields();
    unsubTemplates();
    unsubSubmissions();
    unsubAuditLogs();
    unsubComplaints();
  };
}

// Helper methods to save to Firestore directly
export async function saveSettingsToFirebase(settings: SchoolSettings): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'global'), cleanForFirestore(settings), { merge: true });
  } catch (err) {
    handleFirestoreError('saveSettingsToFirebase', err);
  }
}

export async function saveUserToFirebase(user: User): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), cleanForFirestore(user));
  } catch (err) {
    handleFirestoreError('saveUserToFirebase', err);
  }
}

export async function deleteUserFromFirebase(userId: string): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (err) {
    handleFirestoreError('deleteUserFromFirebase', err);
  }
}

export async function saveUsersListToFirebase(users: User[]): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      batch.set(doc(db, COLLECTIONS.USERS, u.id), cleanForFirestore(u));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError('saveUsersListToFirebase', err);
  }
}

export async function saveSubmissionToFirebase(submission: SubmissionRequest): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, COLLECTIONS.SUBMISSIONS, submission.id), cleanForFirestore(submission));
  } catch (err) {
    handleFirestoreError('saveSubmissionToFirebase', err);
  }
}

export async function replaceSubmissionsInFirebase(submissions: SubmissionRequest[]): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.SUBMISSIONS));
    const newIds = new Set(submissions.map((s) => s.id));
    const batch = writeBatch(db);

    // Delete any documents not in the new spreadsheet dataset
    snap.docs.forEach((docSnapshot) => {
      if (!newIds.has(docSnapshot.id)) {
        batch.delete(docSnapshot.ref);
      }
    });

    // Upsert all current spreadsheet submissions
    submissions.forEach((s) => {
      batch.set(doc(db, COLLECTIONS.SUBMISSIONS, s.id), cleanForFirestore(s));
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError('replaceSubmissionsInFirebase', err);
  }
}

export async function deleteSubmissionFromFirebase(id: string): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.SUBMISSIONS, id));
  } catch (err) {
    handleFirestoreError('deleteSubmissionFromFirebase', err);
  }
}

export async function saveLetterTypeToFirebase(lt: LetterType): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, COLLECTIONS.LETTER_TYPES, lt.id), cleanForFirestore(lt));
  } catch (err) {
    handleFirestoreError('saveLetterTypeToFirebase', err);
  }
}

export async function deleteLetterTypeFromFirebase(id: string): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.LETTER_TYPES, id));
  } catch (err) {
    handleFirestoreError('deleteLetterTypeFromFirebase', err);
  }
}

export async function saveFormFieldsToFirebase(fields: FormField[]): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, COLLECTIONS.FORM_FIELDS));
    const newIds = new Set(fields.map((f) => f.id));

    // Delete any fields from Firestore that were deleted locally
    snap.docs.forEach((docSnapshot) => {
      if (!newIds.has(docSnapshot.id)) {
        batch.delete(docSnapshot.ref);
      }
    });

    fields.forEach((f) => {
      batch.set(doc(db, COLLECTIONS.FORM_FIELDS, f.id), cleanForFirestore(f));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError('saveFormFieldsToFirebase', err);
  }
}

export async function saveTemplateToFirebase(template: LetterTemplate): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, COLLECTIONS.TEMPLATES, template.id), cleanForFirestore(template));
  } catch (err) {
    handleFirestoreError('saveTemplateToFirebase', err);
  }
}

export async function saveAuditLogToFirebase(log: AuditLog): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, log.id), cleanForFirestore(log));
  } catch (err) {
    handleFirestoreError('saveAuditLogToFirebase', err);
  }
}

export async function saveComplaintToFirebase(complaint: ComplaintTicket): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await setDoc(doc(db, COLLECTIONS.COMPLAINTS, complaint.id), cleanForFirestore(complaint));
  } catch (err) {
    handleFirestoreError('saveComplaintToFirebase', err);
  }
}

export async function replaceComplaintsInFirebase(complaints: ComplaintTicket[]): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.COMPLAINTS));
    const newIds = new Set(complaints.map((c) => c.id));
    const batch = writeBatch(db);

    // Delete any documents not in the new spreadsheet dataset
    snap.docs.forEach((docSnapshot) => {
      if (!newIds.has(docSnapshot.id)) {
        batch.delete(docSnapshot.ref);
      }
    });

    // Upsert all current spreadsheet complaints
    complaints.forEach((c) => {
      batch.set(doc(db, COLLECTIONS.COMPLAINTS, c.id), cleanForFirestore(c));
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError('replaceComplaintsInFirebase', err);
  }
}

export async function deleteComplaintFromFirebase(id: string): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.COMPLAINTS, id));
  } catch (err) {
    handleFirestoreError('deleteComplaintFromFirebase', err);
  }
}

