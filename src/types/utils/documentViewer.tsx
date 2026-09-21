/**
 * Document Viewer & Google Drive Embed Utility
 * Mengubah tautan Google Drive dan dokumen menjadi URL yang dapat langsung disematkan (embed)
 * di dalam iframe jendela pratinjau aplikasi tanpa perlu dialihkan ke tab lain.
 */

export interface EmbeddableDoc {
  embedUrl: string;
  directUrl: string;
  isDrive: boolean;
}

/**
 * Mengonversi URL berkas (Google Drive, HTTPS, atau Base64/Blob) menjadi URL pratinjau iframe
 */
export function getEmbeddableDocumentUrl(rawUrl: string): EmbeddableDoc {
  if (!rawUrl) {
    return { embedUrl: '', directUrl: '', isDrive: false };
  }

  const trimmed = rawUrl.trim();

  // Deteksi tautan Google Drive
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    let fileId = '';

    // Pola 1: /file/d/([a-zA-Z0-9_-]+)
    const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile && matchFile[1]) {
      fileId = matchFile[1];
    } else {
      // Pola 2: id=([a-zA-Z0-9_-]+)
      const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      }
    }

    if (fileId) {
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        directUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
        isDrive: true,
      };
    }
  }

  return {
    embedUrl: trimmed,
    directUrl: trimmed,
    isDrive: false,
  };
}

/**
 * Menangani pengunduhan berkas baik dari Google Drive, URL biasa, maupun Base64 Data URI
 */
export function triggerDocumentDownload(rawUrl: string, fileName: string): void {
  if (!rawUrl) return;

  const trimmed = rawUrl.trim();

  // Jika tautan Google Drive, gunakan direct download link Google Drive
  if (trimmed.includes('drive.google.com')) {
    let fileId = '';
    const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile && matchFile[1]) {
      fileId = matchFile[1];
    } else {
      const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      }
    }

    if (fileId) {
      window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank', 'noopener,noreferrer');
      return;
    }
    window.open(trimmed, '_blank', 'noopener,noreferrer');
    return;
  }

  // Jika URL HTTP/HTTPS biasa
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    window.open(trimmed, '_blank', 'noopener,noreferrer');
    return;
  }

  // Jika Base64 / Blob
  try {
    let safeUrl = trimmed;
    if (!trimmed.startsWith('blob:')) {
      const parts = trimmed.split(';base64,');
      if (parts.length === 2) {
        const contentType = parts[0].replace('data:', '') || 'application/pdf';
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        safeUrl = URL.createObjectURL(blob);
      }
    }
    const a = document.createElement('a');
    a.href = safeUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Failed to trigger download:', err);
    window.open(trimmed, '_blank');
  }
}
