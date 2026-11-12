/**
 * ADSA Client-Side High-Efficiency Image Optimization Engine
 * Crops images to a crisp 1:1 square, scales to max 400x400 px,
 * and compresses to ultra-lightweight WebP / JPEG format (<45 KB).
 */

export async function optimizeProfilePhoto(fileOrBlob, options = {}) {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.85,
    cropSquare = true,
    maxSizeKb = null,
  } = options;

  return new Promise((resolve, reject) => {
    if (!fileOrBlob) {
      return reject(new Error('No image file provided.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');

          let srcX = 0;
          let srcY = 0;
          let srcWidth = img.width;
          let srcHeight = img.height;

          // 1:1 Square Center Crop
          if (cropSquare) {
            if (srcWidth > srcHeight) {
              srcX = Math.round((srcWidth - srcHeight) / 2);
              srcWidth = srcHeight;
            } else if (srcHeight > srcWidth) {
              srcY = Math.round((srcHeight - srcWidth) / 2);
              srcHeight = srcWidth;
            }
          }

          let outputWidth = Math.min(maxWidth, srcWidth);
          let outputHeight = Math.min(maxHeight, srcHeight);
          let dataUrl;
          let format;
          let sizeKb;
          let outputQuality = quality;

          // Retry with lower quality and smaller dimensions when a caller needs
          // a bounded payload (About photos are stored in Firestore documents).
          do {
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            const renderContext = canvas.getContext('2d');
            if (!renderContext) {
              return reject(new Error('Canvas 2D context unavailable.'));
            }
            renderContext.imageSmoothingEnabled = true;
            renderContext.imageSmoothingQuality = 'high';
            renderContext.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, outputWidth, outputHeight);

            format = 'image/webp';
            dataUrl = canvas.toDataURL(format, outputQuality);
            if (!dataUrl.startsWith('data:image/webp')) {
              format = 'image/jpeg';
              dataUrl = canvas.toDataURL(format, outputQuality);
            }

            const base64Payload = dataUrl.slice(dataUrl.indexOf(',') + 1);
            sizeKb = Math.ceil((base64Payload.length * 3) / 4 / 1024);
            if (!maxSizeKb || sizeKb <= maxSizeKb) break;

            if (outputQuality > 0.45) {
              outputQuality = Math.max(0.45, outputQuality - 0.1);
            } else {
              outputWidth = Math.max(96, Math.floor(outputWidth * 0.85));
              outputHeight = Math.max(96, Math.floor(outputHeight * 0.85));
            }
          } while (outputWidth > 96 || outputHeight > 96);

          if (maxSizeKb && sizeKb > maxSizeKb) {
            return reject(new Error(`Image could not be compressed below ${maxSizeKb} KB.`));
          }

          resolve({
            dataUrl,
            width: outputWidth,
            height: outputHeight,
            sizeKb,
            format,
            originalSizeKb: Math.round((fileOrBlob.size || 0) / 1024),
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}
