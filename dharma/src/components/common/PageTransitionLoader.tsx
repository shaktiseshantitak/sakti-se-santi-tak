import React, { useEffect, useState } from 'react';

// FIXED: "App loader nahi hai" — there was no visible feedback the instant
// someone clicked a nav link/button. The only loading indicator in the
// whole app was the Suspense `fallback`, which React only shows while a
// lazy page's JS chunk is still being downloaded — once a chunk is
// cached (i.e. the visitor already opened that page once this session),
// clicking it again shows nothing at all in between, and on a slow
// connection the very first click on ANY page felt like the click did
// nothing for a moment. Two pieces fixed this:
//
// 1. TopProgressBar — a slim animated bar across the very top of the
//    screen (the same pattern used by YouTube/GitHub/Medium) that starts
//    filling the instant handleNavigate() runs, so every single
//    navigation gets immediate visual feedback regardless of whether a
//    chunk needs downloading.
// 2. OmMandalaLoader — replaces the old plain spinner-and-text
//    Suspense fallback with something themed to the site (a slowly
//    turning mandala ring around a pulsing ॐ, gold/maroon palette,
//    rotating devotional taglines) so a slower first-time chunk load
//    reads as "on brand" rather than a generic loading spinner.

export const TopProgressBar: React.FC<{ active: boolean }> = ({ active }) => {
  const [width, setWidth] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    let growTimer: number | undefined;
    let hideTimer: number | undefined;

    if (active) {
      setVisible(true);
      setWidth(0);
      // Kick off on the next frame so the 0% -> ~78% transition actually
      // animates instead of the browser coalescing it into the initial
      // paint (which would make the bar just appear already-full).
      growTimer = window.setTimeout(() => setWidth(78), 30);
    } else if (visible) {
      setWidth(100);
      hideTimer = window.setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 350);
    }

    return () => {
      if (growTimer) window.clearTimeout(growTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F4E285] to-[#8B1E3F] shadow-[0_0_8px_rgba(212,175,55,0.7)] transition-[width,opacity] ease-out"
        style={{
          width: `${width}%`,
          transitionDuration: width === 100 ? '250ms' : '650ms',
          opacity: width === 0 ? 0 : 1,
        }}
      />
    </div>
  );
};

const LOADING_TAGLINES: string[] = [
  'शक्ति से शांति की ओर...',
  'सामग्री लोड हो रही है...',
  'पावन ग्रंथ तैयार हो रहा है...',
];

export const OmMandalaLoader: React.FC = () => {
  const [taglineIndex, setTaglineIndex] = useState<number>(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTaglineIndex(i => (i + 1) % LOADING_TAGLINES.length);
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#F8F4E8] text-[#8B1E3F]">
      <div className="relative w-20 h-20 mb-5">
        {/* Outer mandala ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4AF37]/50 animate-[spin_6s_linear_infinite]" />
        {/* Inner ring, opposite direction for a layered mandala feel */}
        <div className="absolute inset-2 rounded-full border-2 border-[#8B1E3F]/30 animate-[spin_4s_linear_infinite_reverse]" />
        {/* Pulsing Om glyph at the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-3xl font-bold text-[#8B1E3F] animate-pulse">ॐ</span>
        </div>
      </div>

      <span
        key={taglineIndex}
        className="font-serif font-bold text-sm tracking-widest text-[#4A2C17] animate-[fadeIn_0.4s_ease-in]"
      >
        {LOADING_TAGLINES[taglineIndex]}
      </span>

      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};
