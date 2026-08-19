import { StorageService } from './storage';

export const AppsScriptService = {
  /**
   * Generates production-ready Google Apps Script Code.gs
   * that automatically bootstraps sheets:
   * (Pengguna, Permohonan, JenisSurat, FieldSurat, Setting, Log, TemplateSurat, NomorSurat, Arsip)
   */
  generateAppsScriptCode(spreadsheetId: string): string {
    return `/**
 * GOOGLE APPS SCRIPT BACKEND ENGINE
 * E-Surat Tata Usaha Siswa & Alumni SMK/SMA
 * Spreadsheet ID: ${spreadsheetId}
 */

const SPREADSHEET_ID = "${spreadsheetId}";

function doGet(e) {
  const action = e.parameter.action || 'ping';
  const response = handleRoute(action, e.parameter);
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action || 'submitRequest';
    const response = handleRoute(action, postData);
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRoute(action, params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  bootstrapSheets(ss);

  if (action === 'ping') {
    return { success: true, message: "Apps Script E-Surat TU Backend Connected", timestamp: new Date() };
  }
  
  if (action === 'getAllData') {
    return {
      success: true,
      permohonan: getSheetDataAsJson(ss, 'Permohonan'),
      jenisSurat: getSheetDataAsJson(ss, 'JenisSurat'),
      fieldSurat: getSheetDataAsJson(ss, 'FieldSurat'),
      setting: getSheetDataAsJson(ss, 'Setting'),
      log: getSheetDataAsJson(ss, 'Log'),
      nomorSurat: getSheetDataAsJson(ss, 'NomorSurat'),
      pengguna: getSheetDataAsJson(ss, 'Pengguna')
    };
  }

  if (action === 'saveNomorSurat') {
    const sheet = ss.getSheetByName('NomorSurat');
    if (!sheet) {
      return { success: false, message: "Sheet NomorSurat tidak ditemukan" };
    }
    const data = sheet.getDataRange().getValues();
    var year = params.tahun || params.year || new Date().getFullYear();
    var formatPattern = params.format || params.letterNumberPattern || '420/{SEQ}/TU-SMK/{YEAR}';
    var counter = params.counterTerakhir || params.currentSeqNumber || params.lastCounter || 1;

    // Check header format
    var isYearFirst = data.length > 0 && (String(data[0][0]).toLowerCase() === 'year' || String(data[0][0]).toLowerCase() === 'tahun');
    
    // Auto append 'Format' header if sheet only has 2 columns
    if (data.length > 0 && data[0].length < 3) {
      sheet.getRange(1, 3).setValue('Format');
    }

    var updated = false;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (isYearFirst) {
        if (String(row[0]) === String(year) || i === 1) {
          sheet.getRange(i + 1, 1, 1, 3).setValues([[ year, counter, formatPattern ]]);
          updated = true;
          break;
        }
      } else {
        if (String(row[0]) === String(params.id || 'num-1') || String(row[1]) === String(year)) {
          sheet.getRange(i + 1, 1, 1, 4).setValues([[ params.id || 'num-1', year, counter, formatPattern ]]);
          updated = true;
          break;
        }
      }
    }

    if (!updated) {
      if (isYearFirst) {
        sheet.appendRow([ year, counter, formatPattern ]);
      } else {
        sheet.appendRow([ params.id || 'num-1', year, counter, formatPattern ]);
      }
    }

    // Juga simpan ke tab Setting agar tersimpan ganda
    var settingSheet = ss.getSheetByName('Setting');
    if (settingSheet) {
      var settingData = settingSheet.getDataRange().getValues();
      var setPatternUpdated = false;
      var setSeqUpdated = false;
      for (var s = 1; s < settingData.length; s++) {
        if (String(settingData[s][0]) === 'letterNumberPattern') {
          settingSheet.getRange(s + 1, 2).setValue(formatPattern);
          setPatternUpdated = true;
        }
        if (String(settingData[s][0]) === 'currentSeqNumber') {
          settingSheet.getRange(s + 1, 2).setValue(counter);
          setSeqUpdated = true;
        }
      }
      if (!setPatternUpdated) settingSheet.appendRow(['letterNumberPattern', formatPattern]);
      if (!setSeqUpdated) settingSheet.appendRow(['currentSeqNumber', counter]);
    }

    logActivity(ss, 'Admin', 'SAVE_NOMOR_SURAT', 'Format: ' + formatPattern + ' | Counter: ' + counter);
    return { success: true };
  }

  if (action === 'saveSetting') {
    const sheet = ss.getSheetByName('Setting');
    const data = sheet.getDataRange().getValues();
    var updated = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === params.key) {
        sheet.getRange(i + 1, 1, 1, 2).setValues([[params.key, typeof params.value === 'object' ? JSON.stringify(params.value) : String(params.value)]]);
        updated = true;
        break;
      }
    }
    if (!updated) {
      sheet.appendRow([params.key, typeof params.value === 'object' ? JSON.stringify(params.value) : String(params.value)]);
    }
    return { success: true };
  }

  if (action === 'saveJenisSurat') {
    const sheet = ss.getSheetByName('JenisSurat');
    const data = sheet.getDataRange().getValues();
    var updated = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === params.id || data[i][1] === params.code) {
        sheet.getRange(i + 1, 1, 1, 7).setValues([[
          params.id,
          params.code || '',
          params.name || '',
          params.description || '',
          params.processingTimeDays || 1,
          params.isActive !== false ? 'Ya' : 'Tidak',
          params.order || 1
        ]]);
        updated = true;
        break;
      }
    }
    if (!updated) {
      sheet.appendRow([
        params.id || 'lt-' + Date.now(),
        params.code || '',
        params.name || '',
        params.description || '',
        params.processingTimeDays || 1,
        params.isActive !== false ? 'Ya' : 'Tidak',
        params.order || 1
      ]);
    }
    logActivity(ss, 'Admin', 'SAVE_JENIS_SURAT', 'Jenis Surat: ' + params.name);
    return { success: true };
  }

  if (action === 'saveUser' || action === 'savePengguna') {
    const sheet = ss.getSheetByName('Pengguna');
    const data = sheet.getDataRange().getValues();
    var updated = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === params.id || data[i][1] === params.username) {
        sheet.getRange(i + 1, 1, 1, 7).setValues([[
          params.id,
          params.username || '',
          params.password || 'admin123',
          params.name || '',
          params.role || 'admin_tu',
          params.email || '',
          params.createdAt || new Date().toISOString()
        ]]);
        updated = true;
        break;
      }
    }
    if (!updated) {
      sheet.appendRow([
        params.id || 'u-' + Date.now(),
        params.username || '',
        params.password || 'admin123',
        params.name || '',
        params.role || 'admin_tu',
        params.email || '',
        params.createdAt || new Date().toISOString()
      ]);
    }
    logActivity(ss, 'Admin', 'SAVE_USER', 'Pengguna: ' + params.username);
    return { success: true };
  }

  if (action === 'saveAllUsers' || action === 'saveAllPengguna') {
    const sheet = ss.getSheetByName('Pengguna');
    const items = params.items || [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
    }
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      sheet.appendRow([
        item.id,
        item.username || '',
        item.password || 'admin123',
        item.name || '',
        item.role || 'admin_tu',
        item.email || '',
        item.createdAt || new Date().toISOString()
      ]);
    }
    logActivity(ss, 'Admin', 'SYNC_ALL_USERS', 'Sinkronisasi ' + items.length + ' pengguna');
    return { success: true };
  }

  if (action === 'saveAllJenisSurat') {
    const sheet = ss.getSheetByName('JenisSurat');
    const items = params.items || [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
    }
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      sheet.appendRow([
        item.id,
        item.code || '',
        item.name || '',
        item.description || '',
        item.processingTimeDays || 1,
        item.isActive !== false ? 'Ya' : 'Tidak',
        item.order || (k + 1)
      ]);
    }
    logActivity(ss, 'Admin', 'SYNC_ALL_JENIS_SURAT', 'Sinkronisasi ' + items.length + ' jenis surat');
    return { success: true };
  }

  if (action === 'submitRequest' || action === 'saveSubmission') {
    const sheet = ss.getSheetByName('Permohonan');
    if (!sheet) return { success: false, message: "Sheet Permohonan tidak ditemukan" };
    var formData = params.formData || {};

    // Auto Upload File Lampiran ke Google Drive
    if (params.fileData && params.fileName) {
      try {
        var folderName = 'Lampiran E-Surat TU';
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

        var base64Str = params.fileData.indexOf(',') > -1 ? params.fileData.split(',')[1] : params.fileData;
        var bytes = Utilities.base64Decode(base64Str);
        var blob = Utilities.newBlob(bytes, params.fileType || 'application/octet-stream', params.fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        formData['DriveLink_Lampiran'] = file.getUrl();
      } catch (errDrive) {
        formData['DriveError'] = errDrive.toString();
      }
    }

    const data = sheet.getDataRange().getValues();
    var updated = false;

    for (var i = 1; i < data.length; i++) {
      var rowId = String(data[i][0]);
      var rowReqNum = String(data[i][1]);
      if ((params.id && rowId === String(params.id)) || (params.requestNumber && rowReqNum === String(params.requestNumber))) {
        sheet.getRange(i + 1, 1, 1, 10).setValues([[
          params.id || rowId,
          params.requestNumber || rowReqNum,
          params.applicantName || data[i][2],
          params.applicantEmail || data[i][3],
          params.applicantPhone || data[i][4],
          params.letterTypeName || data[i][5],
          params.status || data[i][6] || 'Menunggu',
          typeof formData === 'object' ? JSON.stringify(formData) : String(formData),
          data[i][8] || new Date().toISOString(),
          params.officialLetterNumber || data[i][9] || ''
        ]]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      const row = [
        params.id || 'sub-' + Date.now(),
        params.requestNumber,
        params.applicantName,
        params.applicantEmail,
        params.applicantPhone,
        params.letterTypeName,
        params.status || 'Menunggu',
        typeof formData === 'object' ? JSON.stringify(formData) : String(formData),
        new Date().toISOString(),
        params.officialLetterNumber || ''
      ];
      sheet.appendRow(row);
    }
    logActivity(ss, 'Sistem Public', 'SUBMIT_REQUEST', 'Permohonan: ' + params.requestNumber);
    return { success: true, requestNumber: params.requestNumber };
  }

  if (action === 'updateStatus') {
    const sheet = ss.getSheetByName('Permohonan');
    if (!sheet) return { success: false, message: "Sheet Permohonan tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === params.requestNumber || data[i][0] === params.id) {
        sheet.getRange(i + 1, 7).setValue(params.status); // Col Status
        if (params.officialLetterNumber) sheet.getRange(i + 1, 10).setValue(params.officialLetterNumber);

        // Jika status Selesai, simpan/arsipkan ke Sheet Arsip
        if (params.status === 'Selesai') {
          try {
            var arsipSheet = ss.getSheetByName('Arsip');
            if (arsipSheet) {
              var reqId = data[i][0];
              var reqNoResmi = params.officialLetterNumber || data[i][9] || data[i][1];
              var applicantName = data[i][2];
              var letterTypeName = data[i][5];
              var issueDate = new Date().toLocaleDateString('id-ID');
              var fileUrl = params.issuedDocumentUrl || '';

              var arsipData = arsipSheet.getDataRange().getValues();
              var arsipExists = false;
              for (var a = 1; a < arsipData.length; a++) {
                if (String(arsipData[a][0]) === String(reqId) || (reqNoResmi && String(arsipData[a][1]) === String(reqNoResmi))) {
                  arsipSheet.getRange(a + 1, 1, 1, 6).setValues([[reqId, reqNoResmi, applicantName, letterTypeName, issueDate, fileUrl]]);
                  arsipExists = true;
                  break;
                }
              }
              if (!arsipExists) {
                arsipSheet.appendRow([reqId, reqNoResmi, applicantName, letterTypeName, issueDate, fileUrl]);
              }
            }
          } catch (eArsip) {
            // ignore error
          }
        }

        logActivity(ss, params.actor || 'Admin', 'UPDATE_STATUS', 'Nomor: ' + params.requestNumber + ' -> ' + params.status);
        return { success: true, message: "Status updated" };
      }
    }
    return { success: false, message: "Request not found" };
  }

  if (action === 'deleteRequest' || action === 'deleteSubmission') {
    const sheet = ss.getSheetByName('Permohonan');
    if (!sheet) return { success: false, message: "Sheet Permohonan tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(params.id) || String(data[i][1]) === String(params.requestNumber)) {
        sheet.deleteRow(i + 1);
        logActivity(ss, params.actor || 'Admin', 'DELETE_REQUEST', 'Hapus permohonan: ' + (params.requestNumber || params.id));
        return { success: true, message: "Permohonan dihapus" };
      }
    }
    return { success: false, message: "Permohonan tidak ditemukan" };
  }

  return { success: false, message: "Unknown action" };
}

function bootstrapSheets(ss) {
  const requiredSheets = [
    { name: 'Pengguna', headers: ['ID', 'Username', 'Password', 'Nama', 'Role', 'Email', 'CreatedAt'] },
    { name: 'Permohonan', headers: ['ID', 'NoPermohonan', 'NamaPemohon', 'Email', 'HP', 'JenisSurat', 'Status', 'FormData', 'Tanggal', 'NoSuratResmi'] },
    { name: 'JenisSurat', headers: ['ID', 'Kode', 'NamaSurat', 'Deskripsi', 'LamaProsesHari', 'StatusAktif', 'Urutan'] },
    { name: 'FieldSurat', headers: ['ID', 'JenisSuratID', 'Label', 'Name', 'Type', 'Required', 'Urutan'] },
    { name: 'Setting', headers: ['Key', 'Value'] },
    { name: 'Log', headers: ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Details'] },
    { name: 'TemplateSurat', headers: ['ID', 'JenisSuratID', 'Title', 'ContentHtml', 'UpdatedAt'] },
    { name: 'NomorSurat', headers: ['ID', 'Tahun', 'CounterTerakhir', 'Format'] },
    { name: 'Arsip', headers: ['ID', 'NoSurat', 'NamaPemohon', 'JenisSurat', 'TanggalTerbit', 'FileUrl'] }
  ];

  requiredSheets.forEach(function(req) {
    var sheet = ss.getSheetByName(req.name);
    if (!sheet) {
      sheet = ss.insertSheet(req.name);
      sheet.appendRow(req.headers);
      sheet.getRange(1, 1, 1, req.headers.length).setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');
    }
  });
}

function getSheetDataAsJson(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

function logActivity(ss, user, action, details) {
  var sheet = ss.getSheetByName('Log');
  if (sheet) {
    sheet.appendRow(['log-' + Date.now(), new Date().toISOString(), user, 'Admin', action, details]);
  }
}
`;
  },

  sendSubmissionToAppsScript: async function (submission: any): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      let fileData: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let fileType: string | undefined = undefined;

      if (submission.uploadedFiles) {
        const firstFileKey = Object.keys(submission.uploadedFiles)[0];
        if (firstFileKey) {
          const fileObj = submission.uploadedFiles[firstFileKey];
          if (fileObj?.fileUrl?.startsWith('data:')) {
            fileData = fileObj.fileUrl;
            fileName = fileObj.fileName;
            fileType = fileObj.fileUrl.split(';')[0].replace('data:', '');
          }
        }
      }

      const payload = {
        action: 'submitRequest',
        id: submission.id,
        requestNumber: submission.requestNumber,
        applicantName: submission.applicantName,
        applicantEmail: submission.applicantEmail,
        applicantPhone: submission.applicantPhone,
        letterTypeName: submission.letterTypeName,
        status: submission.status || 'Menunggu',
        formData: submission.formData || {},
        officialLetterNumber: submission.officialLetterNumber || '',
        fileData,
        fileName,
        fileType,
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Post to Google Apps Script error:', err);
      return false;
    }
  },

  updateStatusInAppsScript: async function (
    requestNumber: string,
    status: string,
    actor: string,
    officialLetterNumber?: string,
    issuedDocumentUrl?: string
  ): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'updateStatus',
        requestNumber,
        status,
        actor,
        officialLetterNumber: officialLetterNumber || '',
        issuedDocumentUrl: issuedDocumentUrl || '',
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Update status to Google Apps Script error:', err);
      return false;
    }
  },

  sendLetterTypeToAppsScript: async function (letterType: any): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'saveJenisSurat',
        id: letterType.id,
        code: letterType.code,
        name: letterType.name,
        description: letterType.description,
        processingTimeDays: letterType.processingTimeDays,
        isActive: letterType.isActive,
        order: letterType.order || 1,
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Save JenisSurat to Google Apps Script error:', err);
      return false;
    }
  },

  syncAllLetterTypesToAppsScript: async function (): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    const letterTypes = StorageService.getLetterTypes();
    try {
      const payload = {
        action: 'saveAllJenisSurat',
        items: letterTypes,
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Sync all JenisSurat to Google Apps Script error:', err);
      return false;
    }
  },

  sendUserToAppsScript: async function (user: any): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'saveUser',
        id: user.id,
        username: user.username,
        password: user.password || 'admin123',
        name: user.name,
        role: user.role,
        email: user.email,
        createdAt: user.createdAt || new Date().toISOString(),
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Save User to Google Apps Script error:', err);
      return false;
    }
  },

  syncAllUsersToAppsScript: async function (): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    const users = StorageService.getUsers();
    try {
      const payload = {
        action: 'saveAllUsers',
        items: users,
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Sync all users to Google Apps Script error:', err);
      return false;
    }
  },

  sendNomorSuratToAppsScript: async function (pattern?: string, seqNumber?: number): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'saveNomorSurat',
        id: 'num-1',
        tahun: new Date().getFullYear(),
        counterTerakhir: seqNumber ?? settings.currentSeqNumber ?? 1,
        format: pattern || settings.letterNumberPattern || '420/{SEQ}/TU-SMK/{YEAR}',
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Save NomorSurat to Google Apps Script error:', err);
      return false;
    }
  },

  deleteSubmissionFromAppsScript: async function (id: string, requestNumber?: string): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'deleteRequest',
        id,
        requestNumber,
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (err) {
      console.warn('Delete submission in Google Apps Script error:', err);
      return false;
    }
  },

  fetchDataFromAppsScript: async function (isBackground = false): Promise<{ success: boolean; message: string; count: number }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;

    if (!url) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum dikonfigurasi. Silakan atur di menu Sync Google Spreadsheet.',
        count: 0,
      };
    }

    try {
      const response = await fetch(`${url}?action=getAllData`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('URL Web App Google Apps Script tidak ditemukan (HTTP 404). Silakan pastikan Web App telah di-deploy ulang sebagai New Deployment dengan akses Anyone/Siapa saja.');
        }
        throw new Error(`Koneksi Web App Google Apps Script gagal (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal mengambil data dari Google Apps Script');
      }

      const permohonanList = data.permohonan || [];
      const parsedSubmissions: any[] = [];

      for (const item of permohonanList) {
        let formData = {};
        try {
          formData = typeof item.FormData === 'string' ? JSON.parse(item.FormData) : (item.FormData || {});
        } catch (e) {
          formData = {};
        }

        parsedSubmissions.push({
          id: String(item.ID || item.id || ('sub-' + Date.now())),
          requestNumber: String(item.NoPermohonan || item.requestNumber || 'SRT-000'),
          letterTypeId: 'lt-1',
          letterTypeName: String(item.JenisSurat || item.letterTypeName || 'Surat Keterangan'),
          applicantName: String(item.NamaPemohon || item.applicantName || 'Pemohon'),
          applicantEmail: String(item.Email || item.applicantEmail || ''),
          applicantPhone: String(item.HP || item.applicantPhone || ''),
          applicantRole: 'siswa',
          formData: formData,
          status: item.Status || 'Menunggu',
          officialLetterNumber: item.NoSuratResmi || undefined,
          timeline: [
            {
              status: item.Status || 'Menunggu',
              timestamp: item.Tanggal || new Date().toISOString(),
              actor: 'Spreadsheet Sync',
              note: 'Data diambil langsung dari Google Spreadsheet.',
            }
          ],
          createdAt: item.Tanggal || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Merge parsed submissions from Google Apps Script with existing local/Firebase submissions
      const currentSubmissions = StorageService.getSubmissions();
      const map = new Map<string, any>();

      // Populate map with current local/Firebase submissions
      for (const s of currentSubmissions) {
        if (s.id) map.set(s.id, s);
        if (s.requestNumber) map.set(s.requestNumber.toLowerCase().trim(), s);
      }

      // Upsert/merge parsed submissions from Google Spreadsheet
      for (const parsed of parsedSubmissions) {
        const reqNumKey = parsed.requestNumber ? parsed.requestNumber.toLowerCase().trim() : '';
        const existing = map.get(parsed.id) || (reqNumKey ? map.get(reqNumKey) : null);

        if (existing) {
          const merged = {
            ...existing,
            ...parsed,
            formData: { ...existing.formData, ...parsed.formData },
            status: parsed.status || existing.status,
            officialLetterNumber: parsed.officialLetterNumber || existing.officialLetterNumber,
            uploadedFiles: existing.uploadedFiles || parsed.uploadedFiles,
            timeline: existing.timeline && existing.timeline.length > (parsed.timeline?.length || 0)
              ? existing.timeline
              : parsed.timeline,
          };
          map.set(existing.id, merged);
          if (reqNumKey) map.set(reqNumKey, merged);
        } else {
          map.set(parsed.id, parsed);
          if (reqNumKey) map.set(reqNumKey, parsed);
        }
      }

      // Extract unique list of merged submissions
      const mergedList = Array.from(new Set(map.values()));

      // Sort by createdAt descending
      mergedList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      StorageService.saveSubmissions(mergedList);

      return {
        success: true,
        message: `Berhasil sinkronisasi ${mergedList.length} data permohonan dari Google Spreadsheet & Firebase!`,
        count: mergedList.length,
      };
    } catch (err: any) {
      if (!isBackground) {
        console.warn('Fetch data from Apps Script notice:', err?.message || err);
      }
      return {
        success: false,
        message: 'Gagal menarik data dari Google Spreadsheet: ' + (err.message || 'Cek konfigurasi Web App URL'),
        count: 0,
      };
    }
  },

  syncAllToAppsScript: async function (): Promise<{ success: boolean; message: string; count: number }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    const submissions = StorageService.getSubmissions();
    const letterTypes = StorageService.getLetterTypes();
    const users = StorageService.getUsers();

    if (!url) {
      return {
        success: true,
        message: `[Simulasi Sync] ${submissions.length} permohonan, ${letterTypes.length} jenis surat, format nomor surat, dan ${users.length} pengguna tersimpan secara lokal. Masukkan URL Web App Google Apps Script untuk sinkronisasi langsung ke Google Sheet.`,
        count: submissions.length,
      };
    }

    try {
      // Sync Jenis Surat, Pengguna, dan Format Nomor Surat
      await this.syncAllLetterTypesToAppsScript();
      await this.syncAllUsersToAppsScript();
      await this.sendNomorSuratToAppsScript();

      let sentCount = 0;
      for (const sub of submissions) {
        await this.sendSubmissionToAppsScript(sub);
        sentCount++;
      }
      return {
        success: true,
        message: `Berhasil mengirim ${sentCount} data permohonan, ${letterTypes.length} Jenis Surat, Format Nomor Surat, dan ${users.length} Pengguna secara realtime ke Google Spreadsheet!`,
        count: sentCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal mengirim data ke Web App Apps Script: ' + err.message,
        count: 0,
      };
    }
  },

  async syncWithAppsScript(): Promise<{ success: boolean; message: string }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;

    if (!url) {
      const submissions = StorageService.getSubmissions();
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: `[Simulasi Sync] ${submissions.length} permohonan berhasil disinkronkan ke Spreadsheet ${settings.spreadsheetId}.`,
          });
        }, 1200);
      });
    }

    return this.syncAllToAppsScript();
  },
};
