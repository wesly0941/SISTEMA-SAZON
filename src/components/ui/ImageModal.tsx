import React from 'react';
import { X } from 'lucide-react';
import { DEFAULT_DISH_IMAGE } from '../../utils/format';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Vista ampliada de fotografía"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={imageUrl}
        alt="Fotografía del plato"
        referrerPolicy="no-referrer"
        onClick={(e) => e.stopPropagation()}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = DEFAULT_DISH_IMAGE;
        }}
        className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl border border-white/10"
      />
    </div>
  );
};
