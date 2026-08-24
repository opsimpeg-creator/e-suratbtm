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
      pengaduan: getSheetDataAsJson(ss, 'Pengaduan'),
      jenisSurat: getSheetDataAsJson(ss, 'JenisSurat'),
      fieldSurat: getSheetDataAsJson(ss, 'FieldSurat'),
      masterKelas: getSheetDataAsJson(ss, 'MasterKelas'),
      masterJurusan: getSheetDataAsJson(ss, 'MasterJurusan'),
      setting: getSheetDataAsJson(ss, 'Setting'),
      log: getSheetDataAsJson(ss, 'Log'),
      nomorSurat: getSheetDataAsJson(ss, 'NomorSurat'),
      pengguna: getSheetDataAsJson(ss, 'Pengguna')
    };
  }

  if (action === 'getMasterData' || action === 'getMasterKelasJurusan') {
    return {
      success: true,
      masterKelas: getSheetDataAsJson(ss, 'MasterKelas'),
      masterJurusan: getSheetDataAsJson(ss, 'MasterJurusan')
    };
  }

  if (action === 'saveAllMasterKelas') {
    const sheet = ss.getSheetByName('MasterKelas');
    if (!sheet) return { success: false, message: "Sheet MasterKelas tidak ditemukan" };
    const items = params.items || params.classes || [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    }
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      var namaKelas = typeof item === 'string' ? item : (item.NamaKelas || item.nama || item.name || '');
      var tingkat = typeof item === 'object' ? (item.Tingkat || item.tingkat || '') : (namaKelas.startsWith('XII') ? 'XII' : (namaKelas.startsWith('XI') ? 'XI' : (namaKelas.startsWith('X') ? 'X' : '')));
      sheet.appendRow([
        'cls-' + (k + 1),
        namaKelas,
        tingkat,
        'Ya',
        k + 1
      ]);
    }
    logActivity(ss, 'Admin', 'SYNC_MASTER_KELAS', 'Sinkronisasi ' + items.length + ' kelas');
    return { success: true, count: items.length };
  }

  if (action === 'saveAllMasterJurusan') {
    const sheet = ss.getSheetByName('MasterJurusan');
    if (!sheet) return { success: false, message: "Sheet MasterJurusan tidak ditemukan" };
    const items = params.items || params.majors || [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    }
    for (var m = 0; m < items.length; m++) {
      var itm = items[m];
      var namaJurusan = typeof itm === 'string' ? itm : (itm.NamaJurusan || itm.nama || itm.name || '');
      var kodeJurusan = typeof itm === 'object' ? (itm.KodeJurusan || itm.kode || '') : '';
      if (!kodeJurusan && namaJurusan.includes('(') && namaJurusan.includes(')')) {
        kodeJurusan = namaJurusan.substring(namaJurusan.indexOf('(') + 1, namaJurusan.indexOf(')'));
      }
      sheet.appendRow([
        'mjr-' + (m + 1),
        kodeJurusan || ('JUR-' + (m + 1)),
        namaJurusan,
        'Ya',
        m + 1
      ]);
    }
    logActivity(ss, 'Admin', 'SYNC_MASTER_JURUSAN', 'Sinkronisasi ' + items.length + ' jurusan');
    return { success: true, count: items.length };
  }

  if (action === 'syncAllMasterData') {
    var countCls = 0;
    var countMjr = 0;
    if (params.classes && Array.isArray(params.classes)) {
      var sheetCls = ss.getSheetByName('MasterKelas');
      if (sheetCls) {
        var lastCls = sheetCls.getLastRow();
        if (lastCls > 1) sheetCls.getRange(2, 1, lastCls - 1, 5).clearContent();
        for (var c = 0; c < params.classes.length; c++) {
          var cName = String(params.classes[c]);
          var cTingkat = cName.startsWith('XII') ? 'XII' : (cName.startsWith('XI') ? 'XI' : (cName.startsWith('X') ? 'X' : ''));
          sheetCls.appendRow(['cls-' + (c + 1), cName, cTingkat, 'Ya', c + 1]);
        }
        countCls = params.classes.length;
      }
    }
    if (params.majors && Array.isArray(params.majors)) {
      var sheetMjr = ss.getSheetByName('MasterJurusan');
      if (sheetMjr) {
        var lastMjr = sheetMjr.getLastRow();
        if (lastMjr > 1) sheetMjr.getRange(2, 1, lastMjr - 1, 5).clearContent();
        for (var j = 0; j < params.majors.length; j++) {
          var jName = String(params.majors[j]);
          var jKode = '';
          if (jName.includes('(') && jName.includes(')')) {
            jKode = jName.substring(jName.indexOf('(') + 1, jName.indexOf(')'));
          }
          sheetMjr.appendRow(['mjr-' + (j + 1), jKode || ('JUR-' + (j + 1)), jName, 'Ya', j + 1]);
        }
        countMjr = params.majors.length;
      }
    }
    logActivity(ss, 'Admin', 'SYNC_MASTER_DATA', 'Sinkronisasi ' + countCls + ' kelas & ' + countMjr + ' jurusan');
    return { success: true, countClasses: countCls, countMajors: countMjr };
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
    const expectedJsHeaders = ['ID', 'Kode', 'NamaSurat', 'Deskripsi', 'LamaProsesHari', 'StatusAktif', 'Urutan', 'Warna', 'Ikon'];
    var curJsH = sheet.getRange(1, 1, 1, 9).getValues()[0];
    var needJsFix = false;
    for (var h = 0; h < expectedJsHeaders.length; h++) {
      if (!curJsH[h] || String(curJsH[h]).trim() === '') {
        needJsFix = true;
        break;
      }
    }
    if (needJsFix) {
      sheet.getRange(1, 1, 1, 9).setValues([expectedJsHeaders]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');
    }

    const data = sheet.getDataRange().getValues();
    var updated = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === params.id || data[i][1] === params.code) {
        sheet.getRange(i + 1, 1, 1, 9).setValues([[
          params.id,
          params.code || '',
          params.name || '',
          params.description || '',
          params.processingTimeDays || 1,
          params.isActive !== false ? 'Ya' : 'Tidak',
          params.order || 1,
          params.color || 'bg-blue-600',
          params.icon || 'FileText'
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
        params.order || 1,
        params.color || 'bg-blue-600',
        params.icon || 'FileText'
      ]);
    }
    logActivity(ss, 'Admin', 'SAVE_JENIS_SURAT', 'Jenis Surat: ' + params.name + ' (Warna: ' + (params.color || 'default') + ')');
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
    const expectedJsHeaders = ['ID', 'Kode', 'NamaSurat', 'Deskripsi', 'LamaProsesHari', 'StatusAktif', 'Urutan', 'Warna', 'Ikon'];
    sheet.getRange(1, 1, 1, 9).setValues([expectedJsHeaders]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');

    const items = params.items || [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 9).clearContent();
    }
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      sheet.appendRow([
        item.id,
        item.code || '',
        item.name || '',
        item.description || '',
        item.processingTimeDays || 1,
        item.isActive !== false && item.active !== false ? 'Ya' : 'Tidak',
        item.order || (k + 1),
        item.color || 'bg-blue-600',
        item.icon || item.iconName || 'FileText'
      ]);
    }
    logActivity(ss, 'Admin', 'SYNC_ALL_JENIS_SURAT', 'Sinkronisasi ' + items.length + ' jenis surat');
    return { success: true };
  }

  if (action === 'saveLetterTypeFields') {
    const sheet = ss.getSheetByName('FieldSurat');
    if (!sheet) return { success: false, message: "Sheet FieldSurat tidak ditemukan" };
    const letterTypeId = String(params.letterTypeId || '').trim();
    const letterTypeCode = String(params.letterTypeCode || '').trim();
    const items = params.items || params.fields || [];

    // Pastikan header baris 1 di sheet FieldSurat selalu lengkap 10 kolom
    var expectedFsHeaders = ['ID', 'JenisSuratID', 'Label', 'Name', 'Type', 'Required', 'Urutan', 'Placeholder', 'PesanBantuan', 'OpsiPilihan'];
    var currentHeaderRange = sheet.getRange(1, 1, 1, 10);
    var currentHeaders = currentHeaderRange.getValues()[0];
    var needHeaderFix = false;
    for (var h = 0; h < expectedFsHeaders.length; h++) {
      if (!currentHeaders[h] || String(currentHeaders[h]).trim() === '') {
        needHeaderFix = true;
        break;
      }
    }
    if (needHeaderFix) {
      currentHeaderRange.setValues([expectedFsHeaders]);
      currentHeaderRange.setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');
    }

    const data = sheet.getDataRange().getValues();

    // Hapus baris lama milik jenis surat ini secara aman dari bawah ke atas
    for (var i = data.length - 1; i >= 1; i--) {
      var rowTypeId = String(data[i][1]).trim();
      if ((letterTypeId && rowTypeId === letterTypeId) || (letterTypeCode && rowTypeId === letterTypeCode)) {
        sheet.deleteRow(i + 1);
      }
    }

    // Tulis baris kolom terbaru (tanpa dobel)
    for (var f = 0; f < items.length; f++) {
      var itm = items[f];
      sheet.appendRow([
        itm.id || ('f-' + Date.now() + '-' + (f + 1)),
        letterTypeId || letterTypeCode || '',
        itm.label || '',
        itm.name || '',
        itm.type || 'text',
        itm.required !== false && itm.required !== 'FALSE' ? 'TRUE' : 'FALSE',
        itm.order || (f + 1),
        itm.placeholder || '',
        itm.helpText || '',
        Array.isArray(itm.options) ? itm.options.join(', ') : (itm.options || '')
      ]);
    }
    logActivity(ss, 'Admin', 'SAVE_LETTER_FIELDS', 'Perbarui ' + items.length + ' kolom untuk jenis surat ' + (letterTypeCode || letterTypeId));
    return { success: true, count: items.length };
  }

  if (action === 'saveFieldSurat') {
    const sheet = ss.getSheetByName('FieldSurat');
    if (!sheet) return { success: false, message: "Sheet FieldSurat tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    var updated = false;
    var targetId = String(params.id || '').trim();
    var targetTypeId = String(params.letterTypeId || '').trim();
    var targetName = String(params.name || '').trim();

    for (var i = 1; i < data.length; i++) {
      var rowId = String(data[i][0]).trim();
      var rowTypeId = String(data[i][1]).trim();
      var rowName = String(data[i][3]).trim();

      if ((targetId && rowId === targetId) || (targetTypeId && targetName && rowTypeId === targetTypeId && rowName === targetName)) {
        sheet.getRange(i + 1, 1, 1, 10).setValues([[
          params.id || rowId,
          params.letterTypeId || rowTypeId,
          params.label || '',
          params.name || '',
          params.type || 'text',
          params.required !== false && params.required !== 'FALSE' ? 'TRUE' : 'FALSE',
          params.order || 1,
          params.placeholder || '',
          params.helpText || '',
          Array.isArray(params.options) ? params.options.join(', ') : (params.options || '')
        ]]);
        updated = true;
        break;
      }
    }
    if (!updated) {
      sheet.appendRow([
        params.id || 'f-' + Date.now(),
        params.letterTypeId || '',
        params.label || '',
        params.name || '',
        params.type || 'text',
        params.required !== false && params.required !== 'FALSE' ? 'TRUE' : 'FALSE',
        params.order || 1,
        params.placeholder || '',
        params.helpText || '',
        Array.isArray(params.options) ? params.options.join(', ') : (params.options || '')
      ]);
    }
    return { success: true };
  }

  if (action === 'saveAllFieldSurat') {
    const sheet = ss.getSheetByName('FieldSurat');
    if (!sheet) return { success: false, message: "Sheet FieldSurat tidak ditemukan" };
    const items = params.items || params.fields || [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 10).clearContent();
    }
    for (var f = 0; f < items.length; f++) {
      var itm = items[f];
      sheet.appendRow([
        itm.id || ('f-' + (f + 1)),
        itm.letterTypeId || '',
        itm.label || '',
        itm.name || '',
        itm.type || 'text',
        itm.required !== false && itm.required !== 'FALSE' ? 'TRUE' : 'FALSE',
        itm.order || (f + 1),
        itm.placeholder || '',
        itm.helpText || '',
        Array.isArray(itm.options) ? itm.options.join(', ') : (itm.options || '')
      ]);
    }
    logActivity(ss, 'Admin', 'SYNC_ALL_FIELD_SURAT', 'Sinkronisasi ' + items.length + ' kolom formulir');
    return { success: true, count: items.length };
  }

  if (action === 'deleteFieldSurat') {
    const sheet = ss.getSheetByName('FieldSurat');
    if (!sheet) return { success: false, message: "Sheet FieldSurat tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(params.id)) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false };
  }

  if (action === 'submitRequest' || action === 'saveSubmission') {
    var lock = LockService.getScriptLock();
    var hasLock = false;
    try {
      // Kunci antrean LockService hingga 30 detik untuk mencegah nomor ganda saat ada banyak ajuan bersamaan
      hasLock = lock.tryLock(30000);
      if (!hasLock) {
        return { success: false, message: "Server sedang sibuk memproses antrean penomoran. Silakan coba beberapa saat lagi." };
      }

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
      var existingRowIndex = -1;
      var currentYearMonth = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMM');
      var prefix = 'SRT-' + currentYearMonth + '-';
      var usedNumbers = {};

      for (var i = 1; i < data.length; i++) {
        var rowId = String(data[i][0]);
        var rowReqNum = String(data[i][1]).trim();
        if ((params.id && rowId === String(params.id)) || (params.requestNumber && rowReqNum === String(params.requestNumber))) {
          existingRowIndex = i + 1;
        }

        if (rowReqNum.indexOf(prefix) === 0) {
          var numPart = parseInt(rowReqNum.substring(prefix.length), 10);
          if (!isNaN(numPart) && numPart > 0) {
            usedNumbers[numPart] = true;
          }
        }
      }

      // OPSI B: Cari nomor integer terkecil (>= 1) yang belum terpakai / bolong pada bulan ini
      var assignedRequestNumber = params.requestNumber;
      if (existingRowIndex === -1 || !assignedRequestNumber || assignedRequestNumber === 'AUTO' || assignedRequestNumber.indexOf('SRT-') !== 0) {
        var seq = 1;
        while (usedNumbers[seq]) {
          seq++;
        }
        var seqStr = ('0000' + seq).slice(-4);
        assignedRequestNumber = prefix + seqStr;
      }

      if (existingRowIndex > 0) {
        sheet.getRange(existingRowIndex, 1, 1, 10).setValues([[
          params.id || data[existingRowIndex - 1][0],
          assignedRequestNumber,
          params.applicantName || data[existingRowIndex - 1][2],
          params.applicantEmail || data[existingRowIndex - 1][3],
          params.applicantPhone || data[existingRowIndex - 1][4],
          params.letterTypeName || data[existingRowIndex - 1][5],
          params.status || data[existingRowIndex - 1][6] || 'Menunggu',
          typeof formData === 'object' ? JSON.stringify(formData) : String(formData),
          data[existingRowIndex - 1][8] || new Date().toISOString(),
          params.officialLetterNumber || data[existingRowIndex - 1][9] || ''
        ]]);
        updated = true;
      } else {
        var newId = params.id || ('sub-' + Date.now());
        const row = [
          newId,
          assignedRequestNumber,
          params.applicantName || '',
          params.applicantEmail || '',
          params.applicantPhone || '',
          params.letterTypeName || '',
          params.status || 'Menunggu',
          typeof formData === 'object' ? JSON.stringify(formData) : String(formData),
          new Date().toISOString(),
          params.officialLetterNumber || ''
        ];
        sheet.appendRow(row);
      }

      logActivity(ss, 'Sistem Public', 'SUBMIT_REQUEST', 'Permohonan: ' + assignedRequestNumber + ' (Opsi B LockService)');
      return { success: true, requestNumber: assignedRequestNumber, id: params.id || (existingRowIndex > 0 ? data[existingRowIndex - 1][0] : newId) };
    } catch (errLock) {
      return { success: false, error: errLock.toString() };
    } finally {
      if (hasLock) {
        try { lock.releaseLock(); } catch(e){}
      }
    }
  }

  if (action === 'getNextRequestNumber' || action === 'getNextAvailableNumber') {
    var lockSeq = LockService.getScriptLock();
    var hasLockSeq = false;
    try {
      hasLockSeq = lockSeq.tryLock(15000);
      const sheet = ss.getSheetByName('Permohonan');
      if (!sheet) return { success: false, message: "Sheet Permohonan tidak ditemukan" };
      var currentYearMonth = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMM');
      var prefix = 'SRT-' + currentYearMonth + '-';
      var data = sheet.getDataRange().getValues();
      var usedNumbers = {};
      for (var i = 1; i < data.length; i++) {
        var rowReqNum = String(data[i][1]).trim();
        if (rowReqNum.indexOf(prefix) === 0) {
          var numPart = parseInt(rowReqNum.substring(prefix.length), 10);
          if (!isNaN(numPart) && numPart > 0) {
            usedNumbers[numPart] = true;
          }
        }
      }
      var seq = 1;
      while (usedNumbers[seq]) {
        seq++;
      }
      var seqStr = ('0000' + seq).slice(-4);
      return { success: true, nextNumber: prefix + seqStr, seq: seq, prefix: prefix };
    } catch (err) {
      return { success: false, error: err.toString() };
    } finally {
      if (hasLockSeq) {
        try { lockSeq.releaseLock(); } catch(e){}
      }
    }
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

  if (action === 'submitComplaint' || action === 'saveComplaint') {
    const sheet = ss.getSheetByName('Pengaduan');
    if (!sheet) return { success: false, message: "Sheet Pengaduan tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    var existingRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(params.id) || String(data[i][1]) === String(params.ticketNumber)) {
        existingRow = i + 1;
        break;
      }
    }
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, 11).setValues([[
        params.id,
        params.ticketNumber || '',
        params.senderName || '',
        params.senderContact || '',
        params.category || 'Umum',
        params.message || '',
        params.status || 'Baru',
        params.adminResponse || '',
        params.createdAt || new Date().toISOString(),
        params.respondedAt || '',
        params.respondedBy || ''
      ]]);
    } else {
      sheet.appendRow([
        params.id,
        params.ticketNumber || '',
        params.senderName || '',
        params.senderContact || '',
        params.category || 'Umum',
        params.message || '',
        params.status || 'Baru',
        params.adminResponse || '',
        params.createdAt || new Date().toISOString(),
        params.respondedAt || '',
        params.respondedBy || ''
      ]);
    }
    logActivity(ss, params.senderName || 'Pengadu', 'SUBMIT_COMPLAINT', 'Tiket: ' + params.ticketNumber);
    return { success: true, message: "Pengaduan tersimpan", ticketNumber: params.ticketNumber };
  }

  if (action === 'getAllComplaints') {
    return { success: true, complaints: getSheetDataAsJson(ss, 'Pengaduan') };
  }

  if (action === 'deleteComplaint') {
    const sheet = ss.getSheetByName('Pengaduan');
    if (!sheet) return { success: false, message: "Sheet Pengaduan tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(params.id) || String(data[i][1]) === String(params.ticketNumber)) {
        sheet.deleteRow(i + 1);
        logActivity(ss, params.actor || 'Admin', 'DELETE_COMPLAINT', 'Hapus pengaduan: ' + (params.ticketNumber || params.id));
        return { success: true, message: "Pengaduan dihapus" };
      }
    }
    return { success: false, message: "Pengaduan tidak ditemukan" };
  }

  return { success: false, message: "Unknown action" };
}

function bootstrapSheets(ss) {
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  }

  const requiredSheets = [
    { name: 'Pengguna', headers: ['ID', 'Username', 'Password', 'Nama', 'Role', 'Email', 'CreatedAt'] },
    { name: 'Permohonan', headers: ['ID', 'NoPermohonan', 'NamaPemohon', 'Email', 'HP', 'JenisSurat', 'Status', 'FormData', 'Tanggal', 'NoSuratResmi'] },
    { name: 'Pengaduan', headers: ['ID', 'NoTiket', 'NamaPengirim', 'Kontak', 'Kategori', 'IsiPesan', 'Status', 'TanggapanAdmin', 'TanggalMasuk', 'TanggalDitanggapi', 'DitanggapiOleh'] },
    { name: 'MasterKelas', headers: ['ID', 'NamaKelas', 'Tingkat', 'StatusAktif', 'Urutan'] },
    { name: 'MasterJurusan', headers: ['ID', 'KodeJurusan', 'NamaJurusan', 'StatusAktif', 'Urutan'] },
    { name: 'JenisSurat', headers: ['ID', 'Kode', 'NamaSurat', 'Deskripsi', 'LamaProsesHari', 'StatusAktif', 'Urutan', 'Warna', 'Ikon'] },
    { name: 'FieldSurat', headers: ['ID', 'JenisSuratID', 'Label', 'Name', 'Type', 'Required', 'Urutan', 'Placeholder', 'PesanBantuan', 'OpsiPilihan'] },
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

      // Auto populate initial default data for master classes if newly created
      if (req.name === 'MasterKelas') {
        var defaultClasses = [
          'X TJKT 1', 'X TJKT 2', 'X TBSM 1', 'X TBSM 2', 'X AKL 1', 'X AKL 2',
          'XI TJKT 1', 'XI TJKT 2', 'XI TBSM 1', 'XI TBSM 2', 'XI AKL 1', 'XI AKL 2',
          'XII TJKT 1', 'XII TJKT 2', 'XII TBSM 1', 'XII TBSM 2', 'XII AKL 1', 'XII AKL 2'
        ];
        for (var c = 0; c < defaultClasses.length; c++) {
          var cName = defaultClasses[c];
          var cLevel = cName.startsWith('XII') ? 'XII' : (cName.startsWith('XI') ? 'XI' : 'X');
          sheet.appendRow(['cls-' + (c + 1), cName, cLevel, 'Ya', c + 1]);
        }
      }

      // Auto populate initial default data for master majors if newly created
      if (req.name === 'MasterJurusan') {
        var defaultMajors = [
          { code: 'TJKT', name: 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)' },
          { code: 'TBSM', name: 'Teknik Bisnis Sepeda Motor (TBSM)' },
          { code: 'AKL', name: 'Akuntansi dan Keuangan Lembaga (AKL)' },
          { code: 'DKV', name: 'Desain Komunikasi Visual (DKV)' },
          { code: 'DPIB', name: 'Desain Pemodelan dan Informasi Bangunan (DPIB)' },
          { code: 'TAB', name: 'Teknik Alat Berat (TAB)' }
        ];
        for (var m = 0; m < defaultMajors.length; m++) {
          sheet.appendRow(['mjr-' + (m + 1), defaultMajors[m].code, defaultMajors[m].name, 'Ya', m + 1]);
        }
      }
    } else {
      // Jika sheet FieldSurat sudah ada, periksa apakah header kolom lengkap
      if (req.name === 'FieldSurat') {
        var curH = sheet.getRange(1, 1, 1, 10).getValues()[0];
        var needFix = false;
        for (var h = 0; h < req.headers.length; h++) {
          if (!curH[h] || String(curH[h]).trim() === '') {
            needFix = true;
            break;
          }
        }
        if (needFix) {
          sheet.getRange(1, 1, 1, req.headers.length).setValues([req.headers]);
          sheet.getRange(1, 1, 1, req.headers.length).setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');
        }
      }

      // Jika sheet JenisSurat sudah ada, periksa apakah header Warna dan Ikon sudah ada
      if (req.name === 'JenisSurat') {
        var curJsHeaders = sheet.getRange(1, 1, 1, 9).getValues()[0];
        var needJsHeaderFix = false;
        for (var hj = 0; hj < req.headers.length; hj++) {
          if (!curJsHeaders[hj] || String(curJsHeaders[hj]).trim() === '') {
            needJsHeaderFix = true;
            break;
          }
        }
        if (needJsHeaderFix) {
          sheet.getRange(1, 1, 1, req.headers.length).setValues([req.headers]);
          sheet.getRange(1, 1, 1, req.headers.length).setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');
        }
      }
    }
  });
}

function getSheetDataAsJson(ss, sheetName) {
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];

  var defaultFieldSuratHeaders = ['ID', 'JenisSuratID', 'Label', 'Name', 'Type', 'Required', 'Urutan', 'Placeholder', 'PesanBantuan', 'OpsiPilihan'];
  var defaultJenisSuratHeaders = ['ID', 'Kode', 'NamaSurat', 'Deskripsi', 'LamaProsesHari', 'StatusAktif', 'Urutan', 'Warna', 'Ikon'];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < data[i].length; j++) {
      var headerKey = (headers[j] && String(headers[j]).trim() !== '') ? String(headers[j]).trim() : '';
      if (!headerKey && sheetName === 'FieldSurat' && j < defaultFieldSuratHeaders.length) {
        headerKey = defaultFieldSuratHeaders[j];
      }
      if (!headerKey && sheetName === 'JenisSurat' && j < defaultJenisSuratHeaders.length) {
        headerKey = defaultJenisSuratHeaders[j];
      }
      if (headerKey) {
        obj[headerKey] = data[i][j];
      }
      if (sheetName === 'FieldSurat' && j === 9 && !obj['OpsiPilihan']) {
        obj['OpsiPilihan'] = data[i][j];
      }
      if (sheetName === 'JenisSurat' && j === 7 && !obj['Warna']) {
        obj['Warna'] = data[i][j];
      }
      if (sheetName === 'JenisSurat' && j === 8 && !obj['Ikon']) {
        obj['Ikon'] = data[i][j];
      }
    }
    result.push(obj);
  }
  return result;
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

  getNextAvailableNumberFromAppsScript: async function (): Promise<string | null> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return null;
    try {
      const resp = await fetch(`${url}?action=getNextRequestNumber`, { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.nextNumber) {
          return String(data.nextNumber);
        }
      }
    } catch (e) {
      // ignore network errors / CORS fallback
    }
    return null;
  },

  sendSubmissionToAppsScript: async function (submission: any): Promise<{ success: boolean; requestNumber?: string }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return { success: false };

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

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.requestNumber) {
            return { success: true, requestNumber: resJson.requestNumber };
          }
        }
      } catch (postErr) {
        // Fallback with no-cors if standard POST fails CORS
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
          mode: 'no-cors',
        });
      }

      return { success: true, requestNumber: submission.requestNumber };
    } catch (err) {
      console.warn('Post to Google Apps Script error:', err);
      return { success: false };
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
        isActive: letterType.isActive !== false && letterType.active !== false,
        order: letterType.order || 1,
        color: letterType.color || 'bg-blue-600',
        icon: letterType.iconName || letterType.icon || 'FileText',
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
        items: letterTypes.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          description: t.description,
          processingTimeDays: t.processingTimeDays,
          isActive: t.active !== false,
          active: t.active !== false,
          order: t.order || 1,
          color: t.color || 'bg-blue-600',
          icon: t.iconName || (t as any).icon || 'FileText',
        })),
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

  sendFieldToAppsScript: async function (field: any): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'saveFieldSurat',
        id: field.id,
        letterTypeId: field.letterTypeId,
        label: field.label,
        name: field.name,
        type: field.type || 'text',
        required: field.required !== false,
        order: field.order || 1,
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        options: field.options || [],
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
      console.warn('Save FieldSurat to Google Apps Script error:', err);
      return false;
    }
  },

  syncLetterTypeFieldsToAppsScript: async function (
    letterTypeId: string,
    letterTypeCode: string,
    fields: any[]
  ): Promise<{ success: boolean; message: string; count: number }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;

    if (!url) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum dikonfigurasi.',
        count: fields.length,
      };
    }

    try {
      const payload = {
        action: 'saveLetterTypeFields',
        letterTypeId,
        letterTypeCode,
        fields: fields.map((f: any) => ({
          id: f.id,
          label: f.label,
          name: f.name,
          type: f.type || 'text',
          required: f.required !== false,
          order: f.order || 1,
          placeholder: f.placeholder || '',
          helpText: f.helpText || '',
          options: f.options || [],
        })),
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      return {
        success: true,
        message: `Berhasil memperbarui ${fields.length} kolom formulir jenis surat ${letterTypeCode || letterTypeId} di sheet FieldSurat!`,
        count: fields.length,
      };
    } catch (err: any) {
      console.warn('Sync letter type fields error:', err);
      return {
        success: false,
        message: 'Gagal mengirim kolom formulir: ' + (err?.message || 'Koneksi gagal'),
        count: 0,
      };
    }
  },

  fetchLetterTypesFromSpreadsheet: async function (forceSilent = false): Promise<{
    success: boolean;
    letterTypes: any[];
    message: string;
  }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    let rawTypesList: any[] = [];
    let source = '';

    // 1. Try Web App API
    if (url) {
      try {
        const resp = await fetch(`${url}?action=getAllData`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.success && Array.isArray(json.jenisSurat) && json.jenisSurat.length > 0) {
            rawTypesList = json.jenisSurat;
            source = 'Web App API';
          }
        }
      } catch (e) {
        // continue to GViz fallback
      }
    }

    // 2. Fallback via GViz API directly on sheet=JenisSurat
    if (rawTypesList.length === 0 && settings.spreadsheetId) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/gviz/tq?tqx=out:json&sheet=JenisSurat`;
        const gvizRes = await fetch(gvizUrl);
        if (gvizRes.ok) {
          const text = await gvizRes.text();
          const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
          const gvizData = JSON.parse(jsonText);
          if (gvizData?.table?.rows) {
            rawTypesList = gvizData.table.rows.map((r: any) => {
              const c = r.c || [];
              return {
                ID: c[0]?.v,
                Kode: c[1]?.v,
                NamaSurat: c[2]?.v,
                Deskripsi: c[3]?.v,
                LamaProsesHari: c[4]?.v,
                StatusAktif: c[5]?.v,
                Urutan: c[6]?.v,
                Warna: c[7]?.v,
                Ikon: c[8]?.v,
              };
            });
            if (rawTypesList.length > 0) source = 'Google Spreadsheet (GViz)';
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (rawTypesList.length > 0) {
      const currentLetterTypes = StorageService.getLetterTypes();
      const parsedTypes: any[] = [];
      for (let idx = 0; idx < rawTypesList.length; idx++) {
        const item = rawTypesList[idx];
        const name = String(item.NamaSurat || item.name || item.Nama || '').trim();
        const code = String(item.Kode || item.code || '').trim();
        if (!name && !code) continue;

        const rawStatus = String(item.StatusAktif || item.status || item.active || item.isActive || 'Ya').toLowerCase();
        const isActive = rawStatus === 'ya' || rawStatus === 'true' || rawStatus === '1' || rawStatus === 'aktif';

        const colorMap: Record<string, string> = {
          SKAS: 'bg-blue-600',
          SKA: 'bg-indigo-600',
          SRB: 'bg-emerald-600',
          SKBB: 'bg-amber-600',
          PKL: 'bg-purple-600',
          SKBP: 'bg-rose-600',
          SRS: 'bg-indigo-600',
          SPS: 'bg-rose-600',
          SKL: 'bg-emerald-600',
          SDS: 'bg-amber-600',
        };

        const iconMap: Record<string, string> = {
          SKAS: 'FileText',
          SKA: 'GraduationCap',
          SRB: 'Award',
          SKBB: 'FileCheck',
          PKL: 'Briefcase',
          SKBP: 'BookOpen',
          SRS: 'FileSignature',
          SPS: 'FileSpreadsheet',
          SKL: 'GraduationCap',
          SDS: 'FileQuestion',
        };

        const resolvedCode = code || `SRT-${idx + 1}`;
        const rawId = String(item.ID || item.id || `lt-${idx + 1}`);

        // Find if this type already exists in local storage to preserve user-customized color/icon
        const existingType = currentLetterTypes.find(
          (t) => t.id === rawId || (code && t.code.toUpperCase() === code.toUpperCase()) || (name && t.name.toLowerCase() === name.toLowerCase())
        );

        const rawColor = String(item.Warna || item.warna || item.Color || item.color || '').trim();
        let finalColor = rawColor;
        if (!finalColor && existingType?.color) {
          finalColor = existingType.color;
        }
        if (!finalColor) {
          finalColor = colorMap[resolvedCode] || 'bg-blue-600';
        }

        const rawIcon = String(item.Ikon || item.ikon || item.Icon || item.icon || '').trim();
        let finalIcon = rawIcon;
        if (!finalIcon && existingType?.iconName) {
          finalIcon = existingType.iconName;
        }
        if (!finalIcon) {
          finalIcon = iconMap[resolvedCode] || 'FileText';
        }

        parsedTypes.push({
          id: rawId,
          code: resolvedCode,
          name: name || `Surat ${resolvedCode}`,
          description: String(item.Deskripsi || item.description || 'Layanan permohonan surat resmi tata usaha.'),
          processingTimeDays: Number(item.LamaProsesHari || item.processingTimeDays || 1),
          iconName: finalIcon,
          color: finalColor,
          active: isActive,
          order: Number(item.Urutan || item.order || (idx + 1)),
          templateId: `tpl-${idx + 1}`,
        });
      }

      if (parsedTypes.length > 0) {
        parsedTypes.sort((a, b) => (a.order || 0) - (b.order || 0));
        StorageService.saveLetterTypes(parsedTypes);
        return {
          success: true,
          letterTypes: parsedTypes,
          message: `Berhasil memuat ${parsedTypes.length} jenis surat langsung dari sheet JenisSurat (${source})!`,
        };
      }
    }

    return {
      success: false,
      letterTypes: StorageService.getLetterTypes(),
      message: 'Tidak ditemukan data jenis surat baru di Spreadsheet JenisSurat.',
    };
  },

  syncAllFieldsToAppsScript: async function (fields?: any[]): Promise<{ success: boolean; message: string; count: number }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    const targetFields = fields || StorageService.getFormFields();

    if (!url) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum dikonfigurasi.',
        count: targetFields.length,
      };
    }

    try {
      const payload = {
        action: 'saveAllFieldSurat',
        items: targetFields.map((f: any) => ({
          id: f.id,
          letterTypeId: f.letterTypeId,
          label: f.label,
          name: f.name,
          type: f.type || 'text',
          required: f.required !== false,
          order: f.order || 1,
          placeholder: f.placeholder || '',
          helpText: f.helpText || '',
          options: f.options || [],
        })),
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return {
        success: true,
        message: `Berhasil mengirim ${targetFields.length} kolom formulir ke sheet FieldSurat di Google Spreadsheet!`,
        count: targetFields.length,
      };
    } catch (err: any) {
      console.warn('Sync all FieldSurat to Google Apps Script error:', err);
      return {
        success: false,
        message: 'Gagal mengirim kolom formulir ke Spreadsheet: ' + (err?.message || 'Error'),
        count: 0,
      };
    }
  },

  deleteFieldFromAppsScript: async function (fieldId: string): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'deleteFieldSurat',
        id: fieldId,
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
      console.warn('Delete FieldSurat in Google Apps Script error:', err);
      return false;
    }
  },

  fetchFieldsFromSpreadsheet: async function (forceSilent = false): Promise<{
    success: boolean;
    fields: any[];
    message: string;
  }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    let rawFieldsList: any[] = [];
    let source = '';

    // 1. Try Web App API
    if (url) {
      try {
        const resp = await fetch(`${url}?action=getAllData`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.success && Array.isArray(json.fieldSurat) && json.fieldSurat.length > 0) {
            rawFieldsList = json.fieldSurat;
            source = 'Web App API';
          }
        }
      } catch (e) {
        // continue to GViz fallback
      }
    }

    // 2. Fallback via GViz API directly on sheet=FieldSurat
    if (rawFieldsList.length === 0 && settings.spreadsheetId) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/gviz/tq?tqx=out:json&sheet=FieldSurat`;
        const gvizRes = await fetch(gvizUrl);
        if (gvizRes.ok) {
          const text = await gvizRes.text();
          const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
          const gvizData = JSON.parse(jsonText);
          if (gvizData?.table?.rows) {
            rawFieldsList = gvizData.table.rows.map((r: any, idx: number) => {
              const c = r.c || [];
              return {
                ID: c[0]?.v,
                JenisSuratID: c[1]?.v,
                Label: c[2]?.v,
                Name: c[3]?.v,
                Type: c[4]?.v,
                Required: c[5]?.v,
                Urutan: c[6]?.v,
                Placeholder: c[7]?.v,
                PesanBantuan: c[8]?.v,
                OpsiPilihan: c[9]?.v,
              };
            });
            if (rawFieldsList.length > 0) source = 'Google Spreadsheet (GViz)';
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (rawFieldsList.length > 0) {
      const currentFields = StorageService.getFormFields();
      const parsedFields: any[] = [];
      for (let idx = 0; idx < rawFieldsList.length; idx++) {
        const item = rawFieldsList[idx];
        const rawId = String(item.ID || item.id || '').trim();
        const label = String(item.Label || item.label || '').trim();
        const letterTypeId = String(item.JenisSuratID || item.letterTypeId || item.jenisSuratId || '').trim();
        if (!label || !letterTypeId) continue;

        // Skip header rows if accidentally parsed
        if (rawId.toUpperCase() === 'ID' || label.toUpperCase() === 'LABEL' || letterTypeId.toUpperCase() === 'JENISSURATID') {
          continue;
        }

        const rawReq = String(item.Required || item.required || 'TRUE').toUpperCase();
        const isReq = rawReq === 'TRUE' || rawReq === 'YA' || rawReq === '1';

        // Check all possible places where options could be stored (including empty key `""` or column index 9)
        const rawOpts = item.OpsiPilihan || item.Options || item.options || item.opsi || item[''] || (Array.isArray(item) ? item[9] : undefined);
        let parsedOpts: string[] | undefined = undefined;
        if (typeof rawOpts === 'string' && rawOpts.trim()) {
          parsedOpts = rawOpts.split(/[\n,]+/).map((o: string) => o.trim()).filter(Boolean);
        } else if (Array.isArray(rawOpts)) {
          parsedOpts = rawOpts.map((o: any) => String(o).trim()).filter(Boolean);
        }

        const fieldName = String(item.Name || item.name || label.toLowerCase().replace(/[^a-z0-9]/g, '_'));
        const fieldType = String(item.Type || item.type || 'text').toLowerCase();

        // Preserve existing options if incoming options from spreadsheet is empty but field is dropdown/radio
        const existingField = currentFields.find(
          (f) => f.id === rawId || (f.letterTypeId === letterTypeId && f.name === fieldName)
        );
        if ((!parsedOpts || parsedOpts.length === 0) && existingField?.options && existingField.options.length > 0) {
          parsedOpts = existingField.options;
        }

        // Also if field is 'kelas' and still has no options, provide default master classes from settings as fallback
        if ((!parsedOpts || parsedOpts.length === 0) && (fieldName === 'kelas' || label.toLowerCase().includes('kelas')) && ['dropdown', 'radio'].includes(fieldType)) {
          if (settings.classes && settings.classes.length > 0) {
            parsedOpts = settings.classes;
          }
        }

        parsedFields.push({
          id: rawId || `f-${idx + 1}`,
          letterTypeId,
          label,
          name: fieldName,
          type: fieldType,
          required: isReq,
          order: Number(item.Urutan || item.order || (idx + 1)),
          placeholder: item.Placeholder || item.placeholder || undefined,
          helpText: item.PesanBantuan || item.HelpText || item.helpText || undefined,
          options: parsedOpts,
        });
      }

      if (parsedFields.length > 0) {
        parsedFields.sort((a, b) => (a.order || 0) - (b.order || 0));
        await StorageService.saveFormFields(parsedFields);
        return {
          success: true,
          fields: parsedFields,
          message: `Berhasil memuat ${parsedFields.length} kolom formulir dari sheet FieldSurat (${source})!`,
        };
      }
    }

    return {
      success: false,
      fields: StorageService.getFormFields(),
      message: 'Tidak ada data kolom formulir baru di Spreadsheet FieldSurat. Menggunakan kolom yang tersimpan.',
    };
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
      const currentSubmissions = StorageService.getSubmissions();
      const parsedSubmissions: any[] = [];

      for (const item of permohonanList) {
        let formData = {};
        try {
          formData = typeof item.FormData === 'string' ? JSON.parse(item.FormData) : (item.FormData || {});
        } catch (e) {
          formData = {};
        }

        const itemId = String(item.ID || item.id || ('sub-' + Date.now()));
        const reqNum = String(item.NoPermohonan || item.requestNumber || 'SRT-000');
        const existingSub = currentSubmissions.find(
          (s) => (s.requestNumber && s.requestNumber.trim() === reqNum.trim()) || s.id === itemId
        );

        parsedSubmissions.push({
          id: itemId,
          requestNumber: reqNum,
          letterTypeId: existingSub?.letterTypeId || 'lt-1',
          letterTypeName: String(item.JenisSurat || item.letterTypeName || existingSub?.letterTypeName || 'Surat Keterangan'),
          applicantName: String(item.NamaPemohon || item.applicantName || existingSub?.applicantName || 'Pemohon'),
          applicantEmail: String(item.Email || item.applicantEmail || existingSub?.applicantEmail || ''),
          applicantPhone: String(item.HP || item.applicantPhone || existingSub?.applicantPhone || ''),
          applicantRole: existingSub?.applicantRole || 'siswa',
          formData: {
            ...(existingSub?.formData || {}),
            ...formData,
            ...(existingSub?.formData?._officialFileName ? { _officialFileName: existingSub.formData._officialFileName } : {}),
            ...(existingSub?.formData?._officialFileUrl ? { _officialFileUrl: existingSub.formData._officialFileUrl } : {}),
          },
          uploadedFiles: existingSub?.uploadedFiles,
          status: item.Status || existingSub?.status || 'Menunggu',
          officialLetterNumber: item.NoSuratResmi || existingSub?.officialLetterNumber || undefined,
          officialLetterDate: existingSub?.officialLetterDate,
          issuedDocumentUrl: item.FileUrl || item.issuedDocumentUrl || existingSub?.issuedDocumentUrl || undefined,
          qrVerificationCode: existingSub?.qrVerificationCode || `VERIF-${reqNum}-${Math.floor(1000 + Math.random() * 9000)}`,
          timeline: existingSub?.timeline && existingSub.timeline.length > 0 ? existingSub.timeline : [
            {
              status: item.Status || 'Menunggu',
              timestamp: item.Tanggal || new Date().toISOString(),
              actor: 'Spreadsheet Sync',
              note: 'Data diambil langsung dari Google Spreadsheet.',
            }
          ],
          createdAt: item.Tanggal || existingSub?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Parse Complaints / Pengaduan
      let rawComplaintsList: any[] = data.pengaduan || data.complaints || [];

      // Parse Master Kelas & Master Jurusan from Spreadsheet
      if (Array.isArray(data.masterKelas) && data.masterKelas.length > 0) {
        const clsList = data.masterKelas
          .filter((c: any) => String(c.StatusAktif || c.status || 'Ya').toLowerCase() !== 'tidak')
          .map((c: any) => String(c.NamaKelas || c.nama || c.name || '').trim())
          .filter(Boolean);
        if (clsList.length > 0) {
          settings.classes = clsList;
        }
      }

      if (Array.isArray(data.masterJurusan) && data.masterJurusan.length > 0) {
        const mjrList = data.masterJurusan
          .filter((m: any) => String(m.StatusAktif || m.status || 'Ya').toLowerCase() !== 'tidak')
          .map((m: any) => String(m.NamaJurusan || m.nama || m.name || '').trim())
          .filter(Boolean);
        if (mjrList.length > 0) {
          settings.majors = mjrList;
        }
      }
      StorageService.saveSettings(settings);

      // If pengaduanList is empty in getAllData, query ?action=getAllComplaints as fallback
      if (!rawComplaintsList || rawComplaintsList.length === 0) {
        try {
          const compResp = await fetch(`${url}?action=getAllComplaints`);
          if (compResp.ok) {
            const compJson = await compResp.json();
            if (compJson.success && Array.isArray(compJson.complaints)) {
              rawComplaintsList = compJson.complaints;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Fallback directly to Google Spreadsheet GViz API if still empty
      if ((!rawComplaintsList || rawComplaintsList.length === 0) && settings.spreadsheetId) {
        try {
          const gvizUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/gviz/tq?tqx=out:json&sheet=Pengaduan`;
          const gvizRes = await fetch(gvizUrl);
          if (gvizRes.ok) {
            const text = await gvizRes.text();
            const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const gvizData = JSON.parse(jsonText);
            if (gvizData?.table?.rows) {
              rawComplaintsList = gvizData.table.rows.map((r: any) => {
                const c = r.c || [];
                return {
                  ID: c[0]?.v,
                  NoTiket: c[1]?.v,
                  NamaPengirim: c[2]?.v,
                  Kontak: c[3]?.v,
                  Kategori: c[4]?.v,
                  IsiPesan: c[5]?.v,
                  Status: c[6]?.v,
                  TanggapanAdmin: c[7]?.v,
                  TanggalMasuk: c[8]?.v,
                  TanggalDitanggapi: c[9]?.v,
                  DitanggapiOleh: c[10]?.v,
                };
              });
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const parsedComplaints: any[] = [];
      for (const item of rawComplaintsList) {
        const ticketNum = String(item.NoTiket || item.ticketNumber || '');
        const sender = String(item.NamaPengirim || item.senderName || '');
        const msg = String(item.IsiPesan || item.message || '');
        if (!ticketNum && !sender && !msg) continue;

        parsedComplaints.push({
          id: String(item.ID || item.id || ('tkt-' + Date.now())),
          ticketNumber: ticketNum || 'TKT-000000-0000',
          senderName: sender || 'Pengirim',
          senderContact: String(item.Kontak || item.senderContact || ''),
          category: String(item.Kategori || item.category || 'Umum'),
          message: msg,
          status: (item.Status || item.status || 'Baru'),
          adminResponse: item.TanggapanAdmin || item.adminResponse || undefined,
          createdAt: String(item.TanggalMasuk || item.createdAt || new Date().toISOString()),
          respondedAt: item.TanggalDitanggapi || item.respondedAt || undefined,
          respondedBy: item.DitanggapiOleh || item.respondedBy || undefined,
          updatedAt: String(item.TanggalDitanggapi || item.updatedAt || item.TanggalMasuk || new Date().toISOString()),
        });
      }

      // Save Permohonan
      parsedSubmissions.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      if (parsedSubmissions.length > 0) {
        StorageService.saveSubmissions(parsedSubmissions);
      }

      // Save Pengaduan
      parsedComplaints.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      if (parsedComplaints.length > 0) {
        StorageService.saveComplaints(parsedComplaints);
      }

      // Fetch / Parse JenisSurat directly from Spreadsheet
      try {
        await this.fetchLetterTypesFromSpreadsheet(true);
      } catch (errLetter) {
        // ignore
      }

      // Fetch / Parse FieldSurat
      try {
        await this.fetchFieldsFromSpreadsheet(true);
      } catch (errField) {
        // ignore
      }

      return {
        success: true,
        message: `Berhasil sinkronisasi ${parsedSubmissions.length} permohonan, ${parsedComplaints.length} pesan pengaduan, dan kolom formulir langsung dari Google Spreadsheet!`,
        count: parsedSubmissions.length + parsedComplaints.length,
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

  sendComplaintToAppsScript: async function (complaint: any): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'submitComplaint',
        id: complaint.id,
        ticketNumber: complaint.ticketNumber,
        senderName: complaint.senderName,
        senderContact: complaint.senderContact,
        category: complaint.category || 'Umum',
        message: complaint.message,
        status: complaint.status || 'Baru',
        adminResponse: complaint.adminResponse || '',
        createdAt: complaint.createdAt,
        respondedAt: complaint.respondedAt || '',
        respondedBy: complaint.respondedBy || '',
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (e) {
      console.warn('Apps Script Complaint Sync notice:', e);
      return false;
    }
  },

  fetchMasterDataFromSpreadsheet: async function (forceSilent = false): Promise<{
    success: boolean;
    classes: string[];
    majors: string[];
    message: string;
  }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    let fetchedClasses: string[] = [];
    let fetchedMajors: string[] = [];
    let source = '';

    // 1. Try via Web App URL
    if (url) {
      try {
        const resp = await fetch(`${url}?action=getMasterData`);
        if (resp.ok) {
          const json = await resp.json();
          if (json.success) {
            if (Array.isArray(json.masterKelas) && json.masterKelas.length > 0) {
              fetchedClasses = json.masterKelas
                .filter((c: any) => String(c.StatusAktif || c.status || 'Ya').toLowerCase() !== 'tidak')
                .map((c: any) => String(c.NamaKelas || c.nama || c.name || '').trim())
                .filter(Boolean);
            }
            if (Array.isArray(json.masterJurusan) && json.masterJurusan.length > 0) {
              fetchedMajors = json.masterJurusan
                .filter((m: any) => String(m.StatusAktif || m.status || 'Ya').toLowerCase() !== 'tidak')
                .map((m: any) => String(m.NamaJurusan || m.nama || m.name || '').trim())
                .filter(Boolean);
            }
            if (fetchedClasses.length > 0 || fetchedMajors.length > 0) {
              source = 'Web App API';
            }
          }
        }
      } catch (e) {
        // Continue to GViz fallback
      }
    }

    // 2. Fallback via Google Visualization (GViz) API directly to MasterKelas and MasterJurusan sheets
    if ((fetchedClasses.length === 0 || fetchedMajors.length === 0) && settings.spreadsheetId) {
      try {
        if (fetchedClasses.length === 0) {
          const gvizClsUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/gviz/tq?tqx=out:json&sheet=MasterKelas`;
          const respCls = await fetch(gvizClsUrl);
          if (respCls.ok) {
            const txt = await respCls.text();
            const jsonTxt = txt.substring(txt.indexOf('{'), txt.lastIndexOf('}') + 1);
            const gvizCls = JSON.parse(jsonTxt);
            if (gvizCls?.table?.rows) {
              fetchedClasses = gvizCls.table.rows
                .map((r: any) => {
                  const c = r.c || [];
                  const name = c[1]?.v;
                  const active = c[3]?.v;
                  if (active && String(active).toLowerCase() === 'tidak') return null;
                  return name ? String(name).trim() : null;
                })
                .filter(Boolean) as string[];
              if (fetchedClasses.length > 0) source = 'Google Spreadsheet (GViz)';
            }
          }
        }

        if (fetchedMajors.length === 0) {
          const gvizMjrUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/gviz/tq?tqx=out:json&sheet=MasterJurusan`;
          const respMjr = await fetch(gvizMjrUrl);
          if (respMjr.ok) {
            const txt = await respMjr.text();
            const jsonTxt = txt.substring(txt.indexOf('{'), txt.lastIndexOf('}') + 1);
            const gvizMjr = JSON.parse(jsonTxt);
            if (gvizMjr?.table?.rows) {
              fetchedMajors = gvizMjr.table.rows
                .map((r: any) => {
                  const c = r.c || [];
                  const name = c[2]?.v || c[1]?.v;
                  const active = c[3]?.v;
                  if (active && String(active).toLowerCase() === 'tidak') return null;
                  return name ? String(name).trim() : null;
                })
                .filter(Boolean) as string[];
              if (fetchedMajors.length > 0) source = 'Google Spreadsheet (GViz)';
            }
          }
        }
      } catch (e) {
        // ignore fallback errors
      }
    }

    if (fetchedClasses.length > 0 || fetchedMajors.length > 0) {
      const currentSettings = StorageService.getSettings();
      let updated = false;

      if (fetchedClasses.length > 0) {
        currentSettings.classes = fetchedClasses;
        updated = true;
      }
      if (fetchedMajors.length > 0) {
        currentSettings.majors = fetchedMajors;
        updated = true;
      }

      if (updated) {
        StorageService.saveSettings(currentSettings);
      }

      return {
        success: true,
        classes: fetchedClasses.length > 0 ? fetchedClasses : (settings.classes || []),
        majors: fetchedMajors.length > 0 ? fetchedMajors : (settings.majors || []),
        message: `Berhasil memuat ${fetchedClasses.length} data kelas & ${fetchedMajors.length} data jurusan dari ${source}!`,
      };
    }

    return {
      success: false,
      classes: settings.classes || [],
      majors: settings.majors || [],
      message: 'Belum dapat menghubungkan data dari Spreadsheet Master. Menggunakan data acuan saat ini.',
    };
  },

  syncMasterDataToSpreadsheet: async function (
    classes?: string[],
    majors?: string[]
  ): Promise<{ success: boolean; message: string }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    const targetClasses = classes || settings.classes || [];
    const targetMajors = majors || settings.majors || [];

    if (!url) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum dikonfigurasi. Masukkan URL Web App pada menu Sync Spreadsheet.',
      };
    }

    try {
      const payload = {
        action: 'syncAllMasterData',
        classes: targetClasses,
        majors: targetMajors,
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      return {
        success: true,
        message: `Berhasil mengirim ${targetClasses.length} data Master Kelas & ${targetMajors.length} Master Jurusan ke Google Spreadsheet!`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal mengirim master data ke Spreadsheet: ' + (err.message || 'Koneksi terputus'),
      };
    }
  },

  deleteComplaintInAppsScript: async function (ticketId: string, ticketNumber?: string): Promise<boolean> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    if (!url) return false;

    try {
      const payload = {
        action: 'deleteComplaint',
        id: ticketId,
        ticketNumber: ticketNumber || ticketId,
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch (e) {
      console.warn('Apps Script delete complaint notice:', e);
      return false;
    }
  },

  syncAllToAppsScript: async function (): Promise<{ success: boolean; message: string; count: number }> {
    const settings = StorageService.getSettings();
    const url = settings.webAppUrl || (settings as any).appsScriptWebAppUrl;
    const submissions = StorageService.getSubmissions();
    const letterTypes = StorageService.getLetterTypes();
    const users = StorageService.getUsers();
    const complaints = StorageService.getComplaints();

    if (!url) {
      return {
        success: true,
        message: `[Simulasi Sync] ${submissions.length} permohonan, ${complaints.length} pengaduan, ${letterTypes.length} jenis surat, format nomor surat, dan ${users.length} pengguna tersimpan secara lokal. Masukkan URL Web App Google Apps Script untuk sinkronisasi langsung ke Google Sheet.`,
        count: submissions.length,
      };
    }

    try {
      // Sync Jenis Surat, Pengguna, Format Nomor Surat, Kolom Formulir, dan Pengaduan
      await this.syncAllLetterTypesToAppsScript();
      await this.syncAllUsersToAppsScript();
      await this.sendNomorSuratToAppsScript();
      await this.syncAllFieldsToAppsScript();

      for (const comp of complaints) {
        await this.sendComplaintToAppsScript(comp);
      }

      let sentCount = 0;
      for (const sub of submissions) {
        await this.sendSubmissionToAppsScript(sub);
        sentCount++;
      }
      return {
        success: true,
        message: `Berhasil mengirim ${sentCount} data permohonan, ${complaints.length} pengaduan, kolom formulir, ${letterTypes.length} Jenis Surat, Format Nomor Surat, dan ${users.length} Pengguna secara realtime ke Google Spreadsheet!`,
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
