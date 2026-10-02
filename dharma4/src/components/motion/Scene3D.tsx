import React, { createContext, useContext, useRef } from 'react';
import { useScroll, useReducedMotion, useMotionValue, type MotionValue } from 'motion/react';

export interface Scene3DContextValue {
  /**
   * 0 → 1 progress through this Scene3D's pinned scroll distance.
   * In static/reduced-motion mode this is a MotionValue permanently
   * pinned at 1 ("fully revealed"), so every Layer3D child inside
   * resolves to its resting (fully visible, untransformed) state with
   * zero scroll-linked motion — never a null/undefined value to guard
   * against downstream.
   */
  scrollYProgress: MotionValue<number>;
  isStatic: boolean;
}

const Scene3DContext = createContext<Scene3DContextValue | undefined>(undefined);

/**
 * Used by Layer3D (and ScrollProgressDots) to read the parent Scene3D's
 * scroll progress. Must be called from inside a <Scene3D>.
 */
export function useScene3DContext(): Scene3DContextValue {
  const ctx = useContext(Scene3DContext);
  if (!ctx) {
    throw new Error(
      'useScene3DContext (and <Layer3D>) must be used inside a <Scene3D> component.'
    );
  }
  return ctx;
}

export interface Scene3DProps {
  /** Section content — typically one or more <Layer3D> elements. */
  children: React.ReactNode;
  /**
   * Total pinned scroll distance as a percentage of viewport height.
   * Higher = slower/longer reveal. Default 180 (1.8x viewport height).
   * Keep this in the ~150-180 range on content-heavy pages so total
   * page scroll length doesn't become excessive.
   */
  heightVh?: number;
  /** Optional background (color/gradient) applied to the pinned viewport. */
  background?: string;
  className?: string;
}

/**
 * Pins its children to the viewport while the user scrolls through this
 * section (sticky-based, Apple.com-product-page style: content stays
 * fixed on screen while scroll progress drives its child Layer3D
 * entrance animations), then releases into normal document flow for
 * whatever comes next.
 *
 * Respects `prefers-reduced-motion: reduce` — renders children in
 * normal, unpinned document flow with zero scroll-linked animation.
 * Also degrades gracefully if JS never runs at all, since the pin is
 * applied via a plain CSS `position: sticky` — the unpinned static
 * markup underneath is always valid, readable content.
 */
export const Scene3D: React.FC<Scene3DProps> = ({
  children,
  heightVh = 180,
  background,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Real scroll-linked progress for this section's pinned height. Safe
  // to call even before containerRef is attached on first render —
  // motion's useScroll handles a not-yet-mounted target gracefully.
  const { scrollYProgress: liveProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Always-1 progress used in static/reduced-motion mode.
  const staticProgress = useMotionValue(1);

  const isStatic = !!prefersReducedMotion;
  const scrollYProgress = isStatic ? staticProgress : liveProgress;

  if (isStatic) {
    return (
      <div className={className} style={background ? { background } : undefined}>
        <Scene3DContext.Provider value={{ scrollYProgress, isStatic: true }}>
          {children}
        </Scene3DContext.Provider>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height: `${heightVh}vh` }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
        style={background ? { background } : undefined}
      >
        <Scene3DContext.Provider value={{ scrollYProgress, isStatic: false }}>
          {children}
        </Scene3DContext.Provider>
      </div>
    </div>
  );
};
