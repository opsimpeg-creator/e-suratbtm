import React, { useState, useEffect } from 'react';
import {
  SchoolSettings,
  LetterType,
  SubmissionRequest,
  User,
  ToastNotification,
  ComplaintTicket
} from './types';
import { StorageService } from './services/storage';
import { AppsScriptService } from './services/appsScript';

// Common Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Toast } from './components/common/Toast';

// Public Components
import { LandingPage } from './components/public/LandingPage';
import { TrackStatus } from './components/public/TrackStatus';
import { VerifyLetter } from './components/public/VerifyLetter';
import { InformasiPage } from './components/public/InformasiPage';
import { ContactPage } from './components/public/ContactPage';
import { SubmitRequestModal } from './components/public/SubmitRequestModal';
import { SubmissionSuccessModal } from './components/public/SubmissionSuccessModal';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RequestManagement } from './components/admin/RequestManagement';
import { ComplaintManagement } from './components/admin/ComplaintManagement';
import { LetterTypesManagement } from './components/admin/LetterTypesManagement';
import { FormBuilder } from './components/admin/FormBuilder';
import { SpreadsheetSyncPage } from './components/admin/SpreadsheetSyncPage';
import { UserManagement } from './components/admin/UserManagement';
import { AuditLogView } from './components/admin/AuditLogView';
import { SettingsPage } from './components/admin/SettingsPage';
import { AdminLoginModal } from './components/admin/AdminLoginModal';

export default function App() {
  // Global State
  const [settings, setSettings] = useState<SchoolSettings>(() => StorageService.getSettings());
  const [letterTypes, setLetterTypes] = useState<LetterType[]>(() => StorageService.getLetterTypes());
  const [submissions, setSubmissions] = useState<SubmissionRequest[]>(() => StorageService.getSubmissions());
  const [complaints, setComplaints] = useState<ComplaintTicket[]>(() => StorageService.getComplaints());
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());

  // Navigation State & URL Parameter Auto-routing
  const [initialVerifyCode, setInitialVerifyCode] = useState<string>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      return (
        searchParams.get('verify') ||
        searchParams.get('code') ||
        searchParams.get('qr') ||
        searchParams.get('v') ||
        searchParams.get('verif') ||
        ''
      ).trim();
    } catch {
      return '';
    }
  });

  const [initialTrackNumber, setInitialTrackNumber] = useState<string>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      return (
        searchParams.get('track') ||
        searchParams.get('resi') ||
        searchParams.get('cek') ||
        searchParams.get('req') ||
        ''
      ).trim();
    } catch {
      return '';
    }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const verifyCode = searchParams.get('verify') || searchParams.get('code') || searchParams.get('qr') || searchParams.get('v') || searchParams.get('verif');
      if (verifyCode) return 'verifikasi';

      const trackNum = searchParams.get('track') || searchParams.get('resi') || searchParams.get('cek') || searchParams.get('req');
      if (trackNum) return 'cek-status';

      if (hash === '#verifikasi' || hash === '#verify') return 'verifikasi';
      if (hash === '#cek-status' || hash === '#track') return 'cek-status';
      if (hash === '#informasi') return 'informasi';
      if (hash === '#kontak') return 'kontak';
    } catch {
      // ignore
    }
    return 'beranda';
  });

  const [selectedLetterTypeForSubmit, setSelectedLetterTypeForSubmit] = useState<LetterType | null>(null);
  const [selectedLetterTypeIdForBuilder, setSelectedLetterTypeIdForBuilder] = useState<string | null>(null);
  const [requestFilterStatus, setRequestFilterStatus] = useState<string>('all');
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<SubmissionRequest | null>(null);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [createdSubmission, setCreatedSubmission] = useState<SubmissionRequest | null>(null);

  // Toast System
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    setToast({
      id: 'toast-' + Date.now(),
      type,
      title,
      message,
    });
  };

  const handleCloseToast = () => {
    setToast(null);
  };

  // Sync state helpers
  const refreshAllData = () => {
    setSettings(StorageService.getSettings());
    setLetterTypes(StorageService.getLetterTypes());
    setSubmissions(StorageService.getSubmissions());
    setComplaints(StorageService.getComplaints());
    setCurrentUser(StorageService.getCurrentUser());
  };

  // Initialize Real-time Centralized Database (Firebase Firestore)
  useEffect(() => {
    const unsub = StorageService.initFirebase(() => {
      refreshAllData();
    });

    const handleStorageUpdate = () => {
      refreshAllData();
    };

    window.addEventListener('tu_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // Background polling from Google Apps Script if webAppUrl is configured
    let failedAttempts = 0;
    const triggerAppsScriptSync = () => {
      const currentSettings = StorageService.getSettings();
      if (currentSettings.webAppUrl && failedAttempts < 3) {
        AppsScriptService.fetchDataFromAppsScript(true)
          .then((res) => {
            if (res.success) {
              failedAttempts = 0;
              refreshAllData();
            } else {
              failedAttempts++;
            }
          })
          .catch(() => {
            failedAttempts++;
          });
      }
    };

    // Immediate initial sync on mount
    triggerAppsScriptSync();

    const checkSpreadsheetInterval = setInterval(triggerAppsScriptSync, 30000);

    return () => {
      unsub();
      clearInterval(checkSpreadsheetInterval);
      window.removeEventListener('tu_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Submission Handlers
  const handleOpenSubmitModal = (letterTypeId?: string) => {
    if (letterTypeId) {
      const found = letterTypes.find((t) => t.id === letterTypeId);
      if (found) {
        setSelectedLetterTypeForSubmit(found);
      }
    } else {
      setSelectedLetterTypeForSubmit(letterTypes.find((t) => t.active) || null);
    }
    setIsSubmitModalOpen(true);
  };

  const handleSubmissionSuccess = (newSub: SubmissionRequest) => {
    setCreatedSubmission(newSub);
    setSubmissions(StorageService.getSubmissions());
    setIsSubmitModalOpen(false);
    showToast('success', 'Pengajuan Berhasil!', `Nomor permohonan Anda: ${newSub.requestNumber}`);
  };

  // Login / Logout Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    setIsLoginModalOpen(false);
    setActiveTab('admin-dashboard');
    showToast('success', 'Login Berhasil', `Selamat datang kembali, ${user.name}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    StorageService.setCurrentUser(null);
    setActiveTab('beranda');
    showToast('info', 'Logout Berhasil', 'Anda telah keluar dari Portal Staff TU.');
  };

  // Track & Verify Helpers
  const handleTrackNumberFromLanding = (num: string) => {
    setInitialTrackNumber(num);
    setActiveTab('cek-status');
  };

  const isAdminTab = [
    'admin-dashboard',
    'permohonan',
    'pengaduan',
    'jenis-surat',
    'builder-form',
    'pengguna',
    'log-audit',
    'sync-spreadsheet',
    'pengaturan',
  ].includes(activeTab);

  // Render Public Page Content
  const renderPublicContent = () => {
    switch (activeTab) {
      case 'beranda':
        return (
          <LandingPage
            settings={settings}
            letterTypes={letterTypes}
            submissions={submissions}
            onSelectLetterType={(type) => {
              setSelectedLetterTypeForSubmit(type);
              setIsSubmitModalOpen(true);
            }}
            onTrackNumber={handleTrackNumberFromLanding}
            setActiveTab={setActiveTab}
          />
        );
      case 'cek-status':
        return (
          <TrackStatus
            settings={settings}
            initialNumber={initialTrackNumber}
            onOpenSubmitModal={handleOpenSubmitModal}
            setActiveTab={setActiveTab}
          />
        );
      case 'verifikasi':
        return <VerifyLetter settings={settings} initialCode={initialVerifyCode} />;
      case 'informasi':
        return <InformasiPage settings={settings} onOpenSubmitModal={handleOpenSubmitModal} />;
      case 'kontak':
        return <ContactPage settings={settings} />;
      default:
        return (
          <LandingPage
            settings={settings}
            letterTypes={letterTypes}
            submissions={submissions}
            onSelectLetterType={(type) => {
              setSelectedLetterTypeForSubmit(type);
              setIsSubmitModalOpen(true);
            }}
            onTrackNumber={handleTrackNumberFromLanding}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  // Render Admin View Content
  const renderAdminContent = () => {
    if (!currentUser) {
      return (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Terbatas</h2>
          <p className="text-sm text-slate-600 mb-6">
            Anda harus login terlebih dahulu sebagai Staff TU untuk mengakses Panel Administrasi.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition shadow-md"
          >
            Buka Form Login Staff TU
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'admin-dashboard':
        return (
          <AdminDashboard
            submissions={submissions}
            letterTypes={letterTypes}
            settings={settings}
            setAdminTab={(tab, filterStatus = 'all') => {
              if (tab === 'permohonan') {
                setRequestFilterStatus(filterStatus);
                setSelectedRequestForDetail(null);
              }
              setActiveTab(tab);
            }}
            onSelectRequestDetail={(req) => {
              setSelectedRequestForDetail(req);
              setRequestFilterStatus('all');
              setActiveTab('permohonan');
            }}
          />
        );
      case 'permohonan':
        return (
          <RequestManagement
            submissions={submissions}
            letterTypes={letterTypes}
            settings={settings}
            onRefresh={refreshAllData}
            initialStatusFilter={requestFilterStatus}
            selectedRequestFromDash={selectedRequestForDetail}
          />
        );
      case 'pengaduan':
        return (
          <ComplaintManagement
            complaints={complaints}
            settings={settings}
            onRefresh={refreshAllData}
          />
        );
      case 'jenis-surat':
        return (
          <LetterTypesManagement
            letterTypes={letterTypes}
            onRefresh={refreshAllData}
            onOpenFormBuilder={(type) => {
              setSelectedLetterTypeIdForBuilder(type.id);
              setActiveTab('builder-form');
            }}
          />
        );
      case 'builder-form':
        return (
          <FormBuilder
            letterTypes={letterTypes}
            selectedLetterType={letterTypes.find((t) => t.id === selectedLetterTypeIdForBuilder) || letterTypes[0] || null}
            onRefresh={refreshAllData}
          />
        );
      case 'pengguna':
        return (
          <UserManagement
            currentUser={currentUser}
            onRefresh={refreshAllData}
          />
        );
      case 'log-audit':
        return <AuditLogView />;
      case 'sync-spreadsheet':
        return (
          <SpreadsheetSyncPage
            settings={settings}
            onRefresh={refreshAllData}
          />
        );
      case 'pengaturan':
        return (
          <SettingsPage
            settings={settings}
            onRefresh={refreshAllData}
          />
        );
      default:
        return (
          <AdminDashboard
            submissions={submissions}
            letterTypes={letterTypes}
            settings={settings}
            setAdminTab={setActiveTab}
            onSelectRequestDetail={() => setActiveTab('permohonan')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Toast Notification Container */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={handleCloseToast}
        />
      )}

      {/* Admin Mode vs Public Mode Layout */}
      {isAdminTab && currentUser ? (
        <AdminLayout
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          settings={settings}
          submissions={submissions}
          complaints={complaints}
        >
          {renderAdminContent()}
        </AdminLayout>
      ) : (
        <>
          <Header
            settings={settings}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            onOpenSubmitModal={handleOpenSubmitModal}
          />

          <main className="flex-1">
            {isAdminTab ? renderAdminContent() : renderPublicContent()}
          </main>

          <Footer settings={settings} onOpenLogin={() => setIsLoginModalOpen(true)} />
        </>
      )}

      {/* Modal Dialogs */}
      {isSubmitModalOpen && (
        <SubmitRequestModal
          selectedType={selectedLetterTypeForSubmit}
          settings={settings}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={handleSubmissionSuccess}
        />
      )}

      {createdSubmission && (
        <SubmissionSuccessModal
          request={createdSubmission}
          settings={settings}
          onClose={() => setCreatedSubmission(null)}
          onTrack={(ticketNum) => {
            setCreatedSubmission(null);
            setInitialTrackNumber(ticketNum);
            setActiveTab('cek-status');
          }}
        />
      )}

      {isLoginModalOpen && (
        <AdminLoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

