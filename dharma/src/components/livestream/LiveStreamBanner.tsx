import React from 'react';
import { Radio, Video, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useLiveStream } from '../../context/LiveStreamContext';

interface LiveStreamBannerProps {
  onWatchLive: () => void;
}

export const LiveStreamBanner: React.FC<LiveStreamBannerProps> = ({ onWatchLive }) => {
  const { currentStream, isLive, viewerCount } = useLiveStream();

  if (!isLive || !currentStream) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-700 text-white px-4 py-2.5 shadow-sm relative z-40 overflow-hidden">
      {/* Background Subtle Wave pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          {/* Pulsing Live Badge */}
          <div className="flex items-center gap-1.5 bg-red-950/80 text-red-200 border border-red-400/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-inner shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>LIVE NOW</span>
          </div>

          <div className="flex items-center gap-2 font-medium truncate">
            {currentStream.mode === 'video' ? (
              <Video className="w-4 h-4 text-amber-200 shrink-0" />
            ) : (
              <Radio className="w-4 h-4 text-amber-200 shrink-0" />
            )}
            <span className="font-bold text-amber-100 truncate max-w-[280px] sm:max-w-[400px] lg:max-w-[600px]">
              {currentStream.title}
            </span>
            <span className="hidden md:inline text-amber-200/80">• {currentStream.speaker}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-full text-amber-100 font-semibold text-xs">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>{viewerCount} Live</span>
          </div>

          <button
            onClick={onWatchLive}
            className="bg-white text-red-900 hover:bg-amber-100 font-bold px-3.5 py-1 rounded-full text-xs transition-transform active:scale-95 flex items-center gap-1 shadow-sm"
            aria-label="Join Live Stream"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{currentStream.mode === 'video' ? 'Watch Live (लाइव देखें)' : 'Listen Live (सत्संग सुनें)'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
