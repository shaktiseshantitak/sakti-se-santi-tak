import React from 'react';
import { motion, useTransform } from 'motion/react';
import { backOut } from 'motion-utils';
import { useScene3DContext } from './Scene3D';

export interface Layer3DProps {
  children: React.ReactNode;
  /**
   * 0–1 stagger offset within the parent Scene3D's scroll progress.
   * E.g. 0, 0.12, 0.24 for three cards revealing one after another
   * inside the same Scene3D.
   */
  delay?: number;
  /**
   * Fraction of the parent Scene3D's scroll distance used for this
   * layer's entrance reveal. Default 0.3 — a fast/"energetic" reveal
   * window, not the slower 0.55-0.75 used by calmer presets.
   */
  revealFraction?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Entrance-animates as its parent <Scene3D> is scrolled through:
 * translate3d + scale from a pushed-back/scaled-down start position to
 * its resting position, with an ease-out-back overshoot (a small bounce
 * on arrival) and a blur fade-out that clears by mid-entrance (text
 * stays legible early, no lingering blur). Once settled, content stays
 * fully visible for the rest of the scene's scroll — it never fades
 * back out, so there's no blank/empty viewport moment.
 *
 * Only animates transform/opacity/filter (no layout-triggering
 * properties), and only via the parent Scene3D's MotionValue, so
 * off-screen scenes do no animation work.
 */
export const Layer3D: React.FC<Layer3DProps> = ({
  children,
  delay = 0,
  revealFraction = 0.3,
  className = '',
  style,
}) => {
  const { scrollYProgress, isStatic } = useScene3DContext();

  const start = Math.min(Math.max(delay, 0), 0.99);
  const end = Math.min(start + Math.max(revealFraction, 0.01), 1);
  // Blur clears by the midpoint of the reveal window, then holds at 0 —
  // per spec, blur must not linger into the second half of the entrance.
  const blurMid = start + (end - start) * 0.5;

  const y = useTransform(scrollYProgress, [start, end], [56, 0], { ease: backOut });
  const scale = useTransform(scrollYProgress, [start, end], [0.82, 1], { ease: backOut });
  const z = useTransform(scrollYProgress, [start, end], [-120, 0], { ease: backOut });
  const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
  const blurPx = useTransform(scrollYProgress, [start, blurMid, end], [8, 0, 0]);
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`);

  if (isStatic) {
    // Reduced-motion fallback: fully visible, no transforms, normal flow.
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        y,
        scale,
        opacity,
        filter,
        translateZ: z,
        willChange: 'transform, opacity, filter',
      }}
    >
      {children}
    </motion.div>
  );
};
