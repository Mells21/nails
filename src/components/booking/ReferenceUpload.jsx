import { useState } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { toast } from '../../utils/toast';

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;

const ReferenceUpload = ({ files, onChange }) => {
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const valid = newFiles.filter((f) => {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name} no es una imagen.`);
        return false;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name} supera ${MAX_SIZE_MB}MB.`);
        return false;
      }
      return true;
    });
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    onChange(combined);
  };

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="reference-upload">
      <h3 className="step-title">Fotos de referencia (opcional)</h3>
      <p className="step-subtitle">Subí hasta 3 fotos del diseño que querés (Pinterest, Instagram, etc.)</p>

      {files.length < MAX_FILES && (
        <label className="upload-area" htmlFor="ref-upload">
          <Upload size={32} />
          <span>Hacé clic o arrastrá tus fotos aquí</span>
          <span className="upload-hint">PNG, JPG, WEBP, máx. {MAX_SIZE_MB}MB c/u</span>
          <input
            id="ref-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      )}

      {files.length > 0 && (
        <div className="upload-previews">
          {files.map((file, i) => (
            <div key={i} className="upload-preview">
              <img src={URL.createObjectURL(file)} alt={`Referencia ${i + 1}`} />
              <button
                type="button"
                className="upload-remove"
                onClick={() => removeFile(i)}
                aria-label="Quitar foto"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceUpload;
