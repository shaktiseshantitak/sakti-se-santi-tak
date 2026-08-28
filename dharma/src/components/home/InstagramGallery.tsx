import React from 'react';
import { Instagram, Camera, Heart, ExternalLink } from 'lucide-react';
import { GalleryItem } from '../../types';

interface InstagramGalleryProps {
  gallery: GalleryItem[];
  onViewGalleryClick: () => void;
}

export const InstagramGallery: React.FC<InstagramGalleryProps> = ({ gallery, onViewGalleryClick }) => {
  return (
    <section className="py-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-2">
            <Instagram className="w-3.5 h-3.5" />
            <span>@shaktiseshanti</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
            Sacred Printing Press & Seva Gallery
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Moments from our Varanasi press, book releases, and scripture donation drives across India.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map(item => (
            <div
              key={item.id}
              onClick={onViewGalleryClick}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-zinc-200 dark:border-zinc-800"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
               loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {item.category}
                </span>
                <p className="font-serif text-xs font-bold truncate mt-0.5">
                  {item.title}
                </p>
                <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
