import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';
import { DEFAULT_DISH_IMAGE } from '../../utils/format';

interface DishThumbnailProps {
  src?: string | null;
  alt: string;
  sizeClass?: string;
  onClick?: () => void;
}

export const DishThumbnail: React.FC<DishThumbnailProps> = ({
  src,
  alt,
  sizeClass = 'h-11 w-11',
  onClick,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || DEFAULT_DISH_IMAGE);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setImgSrc(src || DEFAULT_DISH_IMAGE);
  }, [src]);

  if (failed) {
    return (
      <div
        onClick={onClick}
        className={`${sizeClass} shrink-0 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 ${
          onClick ? 'cursor-pointer hover:border-[#8B1E3F]' : ''
        }`}
        title={alt}
      >
        <Utensils className="h-4 w-4" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (imgSrc !== DEFAULT_DISH_IMAGE) {
          setImgSrc(DEFAULT_DISH_IMAGE);
        } else {
          setFailed(true);
        }
      }}
      onClick={onClick}
      className={`${sizeClass} shrink-0 rounded-lg border border-slate-200 object-cover bg-slate-100 transition-transform duration-150 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
    />
  );
};
