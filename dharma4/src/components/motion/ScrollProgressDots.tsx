import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export interface ScrollProgressDotsProps {
  /** Refs to each Scene3D section's outer container, in page order. */
  sceneRefs: React.RefObject<HTMLElement>[];
  className?: string;
}

/**
 * Optional fixed side progress indicator ("01/05" style) showing which
 * pinned Scene3D section is currently active, based on which section's
 * container most overlaps the viewport. Desktop-only by default (hidden
 * below the `lg` breakpoint) since it's a supplementary visual cue, not
 * essential navigation — `aria-hidden` for the same reason.
 *
 * Colors use this site's own maroon/gold palette rather than a generic
 * dark-theme look, so it fits pages with the existing #F8F4E8/#8B1E3F
 * styling instead of assuming a dark background.
 *
 * Purely presentational — does not affect Scene3D/Layer3D behavior at
 * all. A page only needs this if it wants the dot indicator; Scene3D
 * and Layer3D work completely on their own without it.
 */
export const ScrollProgressDots: React.FC<ScrollProgressDotsProps> = ({ sceneRefs, className = '' }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const elements = sceneRefs.map(r => r.current).filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;
        entries.forEach((entry) => {
          const idx = elements.indexOf(entry.target as HTMLElement);
          if (idx !== -1 && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = idx;
          }
        });
        if (bestIndex !== -1) setActiveIndex(bestIndex);
      },
      { threshold: [0.25, 0.5, 0.75, 1] }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sceneRefs]);

  const total = sceneRefs.length;
  if (total === 0) return null;

  return (
    <div
      className={`hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3 ${className}`}
      aria-hidden="true"
    >
      <span className="text-[11px] tracking-widest font-mono font-semibold text-[#8B1E3F]/70">
        {String(activeIndex + 1).padStart(2, '0')}
      </span>
      <div className="flex flex-col gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            animate={{
              backgroundColor: i === activeIndex ? '#D4AF37' : 'rgba(139,30,63,0.25)',
              scale: i === activeIndex ? 1.4 : 1,
            }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <span className="text-[11px] tracking-widest font-mono font-semibold text-[#8B1E3F]/70">
        {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};
