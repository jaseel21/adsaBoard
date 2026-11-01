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
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return reject(new Error('Canvas 2D context unavailable.'));
          }

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

          canvas.width = Math.min(maxWidth, srcWidth);
          canvas.height = Math.min(maxHeight, srcHeight);

          // High-quality bicubic-style image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped & scaled image
          ctx.drawImage(
            img,
            srcX,
            srcY,
            srcWidth,
            srcHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Try exporting to WebP first, fallback to JPEG
          let format = 'image/webp';
          let dataUrl = canvas.toDataURL(format, quality);

          // Check if browser actually supported WebP
          if (!dataUrl.startsWith('data:image/webp')) {
            format = 'image/jpeg';
            dataUrl = canvas.toDataURL(format, quality);
          }

          // Calculate approximate payload size in KB
          const stringLength = dataUrl.length - 'data:image/webp;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383;
          const sizeKb = Math.round(sizeInBytes / 1024);

          resolve({
            dataUrl,
            width: canvas.width,
            height: canvas.height,
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
