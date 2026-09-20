/**
 * @file image-processor.ts
 * @description Prétraitement et compression d'image côté client (downscaling max 1024px)
 * Optimise la bande passante et prévient la saturation mémoire avant l'envoi à l'API Gemini.
 */

export interface ProcessedImage {
  dataUrl: string;
  mimeType: string;
  base64: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;

/**
 * Redimensionne une image (Fichier ou Data URL) pour que sa plus grande dimension ne dépasse pas 1024px.
 * Retourne le Data URL compressé ainsi que la chaîne base64 brute.
 */
export async function processAndCompressImage(source: File | string): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    let objectUrlToRevoke: string | null = null;
    const img = new Image();

    img.onload = () => {
      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (origWidth > MAX_DIMENSION || origHeight > MAX_DIMENSION) {
          if (origWidth >= origHeight) {
            targetWidth = MAX_DIMENSION;
            targetHeight = Math.round((origHeight * MAX_DIMENSION) / origWidth);
          } else {
            targetHeight = MAX_DIMENSION;
            targetWidth = Math.round((origWidth * MAX_DIMENSION) / origHeight);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error("Impossible d'initialiser le contexte de rendu 2D du canvas.");
        }

        // Lissage haute qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
        const commaIdx = dataUrl.indexOf(',');
        const base64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;

        if (objectUrlToRevoke) {
          URL.revokeObjectURL(objectUrlToRevoke);
        }

        resolve({
          dataUrl,
          mimeType,
          base64,
          originalWidth: origWidth,
          originalHeight: origHeight,
          width: targetWidth,
          height: targetHeight
        });
      } catch (err) {
        if (objectUrlToRevoke) {
          URL.revokeObjectURL(objectUrlToRevoke);
        }
        reject(err);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      reject(new Error("Échec du chargement de l'image. Format non supporté ou fichier altéré."));
    };

    if (source instanceof File) {
      objectUrlToRevoke = URL.createObjectURL(source);
      img.src = objectUrlToRevoke;
    } else {
      img.src = source;
    }
  });
}
