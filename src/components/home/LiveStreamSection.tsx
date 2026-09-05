import React from 'react';
import { Radio, Video, Users, Play, Heart, Sparkles, ArrowRight, Disc } from 'lucide-react';
import { useLiveStream } from '../../context/LiveStreamContext';
import { LiveStream } from '../../types';

interface LiveStreamSectionProps {
  onOpenLiveStream: (stream?: LiveStream) => void;
}

export const LiveStreamSection: React.FC<LiveStreamSectionProps> = ({ onOpenLiveStream }) => {
  const { currentStream, isLive, viewerCount, pastStreams } = useLiveStream();

  return (
    <section className="py-12 bg-gradient-to-b from-amber-950 via-zinc-900 to-amber-950 text-white relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-amber-500/20 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>सत्संग एवं लाइव ब्रॉडकास्ट (Audio & Video Live Streams)</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
              लाइव सत्संग कक्ष & ज्ञान प्रवचन
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1 max-w-2xl">
              आचार्य एवं स्वामी जी के सीधे ऑडियो-वीडियो ब्रॉडकास्ट में शामिल हों। प्रश्न पूछें, लाइव सुनें एवं रिकॉर्डेड सत्र देखें।
            </p>
          </div>

          <button
            onClick={() => onOpenLiveStream()}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm shadow-amber-600/30 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Live Satsang Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Live Stream Highlight */}
        {isLive && currentStream && (
          <div className="bg-gradient-to-r from-red-950/80 via-amber-950/80 to-zinc-900 border border-red-500/40 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Stream Thumbnail / Cover */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-sm shrink-0">
                <img
                  src={currentStream.coverImage || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80'}
                  alt={currentStream.title}
                  className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                <span className="absolute top-2 left-2 bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/30">
                    {currentStream.category || 'लाइव सत्संग'}
                  </span>
                  <span className="text-amber-200/80 flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> {viewerCount} Viewers Live
                  </span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-100 leading-tight">
                  {currentStream.title}
                </h3>

                <p className="text-xs text-amber-200/90 font-medium">
                  वक्ता: <span className="font-bold text-amber-300">{currentStream.speaker}</span>
                </p>

                <p className="text-xs text-amber-100/70 line-clamp-2 max-w-xl">
                  {currentStream.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenLiveStream(currentStream)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-sm shadow-red-600/40 flex items-center gap-2 shrink-0 transition-transform active:scale-95"
            >
              <Video className="w-5 h-5" />
              <span>Watch Live Stream Now</span>
            </button>
          </div>
        )}

        {/* Recorded Past Live Streams Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-amber-200 flex items-center gap-2">
              <Disc className="w-5 h-5 text-amber-400" />
              <span>पूर्व लाइव सत्संग रिकॉर्डिंग (Recorded Satsang Replays)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastStreams.map(stream => (
              <div
                key={stream.id}
                onClick={() => onOpenLiveStream(stream)}
                className="bg-zinc-900/80 hover:bg-zinc-800/90 p-4 rounded-2xl border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer group flex items-center gap-4"
              >
                <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                  <img
                    src={stream.coverImage || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=400&q=80'}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"  loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-amber-600/90 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold">
                    <span>{stream.category || 'सत्संग सत्र'}</span>
                    <span>• {stream.viewerCount} Views</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
                    {stream.title}
                  </h4>
                  <p className="text-xs text-amber-200/70 truncate">{stream.speaker}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
