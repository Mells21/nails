/**
 * Convierte un File de imagen a WebP en el navegador (Canvas API) antes
 * de subirlo a Supabase Storage, para no guardar JPG/PNG pesados sin comprimir.
 */
export const toWebP = (file, quality = 0.82) => new Promise((resolve, reject) => {
  if (file.type === 'image/webp') {
    resolve(file);
    return;
  }

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      URL.revokeObjectURL(objectUrl);
      if (!blob) {
        reject(new Error('No se pudo convertir la imagen.'));
        return;
      }
      const newName = file.name.replace(/\.[^.]+$/, '.webp');
      resolve(new File([blob], newName, { type: 'image/webp' }));
    }, 'image/webp', quality);
  };

  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('No se pudo leer la imagen.'));
  };

  img.src = objectUrl;
});
