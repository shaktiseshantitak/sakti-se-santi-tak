import React, { useState } from 'react';
import { Play, Youtube, Clock, User, X } from 'lucide-react';
import { VideoItem } from '../../types';

interface VideosSectionProps {
  videos: VideoItem[];
}

export const VideosSection: React.FC<VideosSectionProps> = ({ videos }) => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  return (
    <section className="py-16 bg-white dark:bg-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-1">
              Devotional Media & Unboxing
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              Discourses & Book Walkthroughs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-2 md:mt-0">
            Watch scholars discuss key Gita chapters and inspect our deluxe hardbound printing press editions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map(vid => (
            <div
              key={vid.id}
              onClick={() => setActiveVideo(vid)}
              className="group bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-sm cursor-pointer transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                <img
                  src={`https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80`}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                 loading="lazy" decoding="async" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-amber-600/90 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> {vid.duration}
                </span>
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                    {vid.category}
                  </span>
                  <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {vid.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    {vid.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-600" /> {vid.speaker}
                  </span>
                  <Youtube className="w-4 h-4 text-rose-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-zinc-950 text-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-sm relative">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-6">
              <span className="text-xs text-amber-400 uppercase font-semibold">
                {activeVideo.category} • Speaker: {activeVideo.speaker}
              </span>
              <h3 className="font-serif font-bold text-lg text-white mt-1">
                {activeVideo.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-2">{activeVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
