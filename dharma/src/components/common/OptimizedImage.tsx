import React, { useState } from 'react';
import { getOptimizedImageUrl, getImageSrcSet } from '../../utils/imageOptimizer';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  targetWidth?: number;
  quality?: number;
  fallbackSrc?: string;
  containerClassName?: string;
  aspectRatio?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  targetWidth = 600,
  quality = 80,
  fallbackSrc = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80',
  className = '',
  containerClassName = '',
  aspectRatio,
  priority = false,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getOptimizedImageUrl(src, { width: targetWidth, quality })
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const srcSet = getImageSrcSet(src);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-amber-950/10 ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton loader animation */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 via-amber-200/30 to-amber-100/20 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-pulse pointer-events-none" />
      )}

      <img
        src={imgSrc}
        srcSet={srcSet}
        sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${targetWidth}px`}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
