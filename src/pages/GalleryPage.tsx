import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';

interface GalleryPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// Exact original hardcoded text, used as default.
const DEFAULT_TITLE = 'Printing Press & Temple Seva Photo Gallery';
const DEFAULT_SUBTITLE = 'Visual moments from Varanasi manuscript gilding, book releases, and scripture donation drives.';

export const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
  const { gallery, siteSettings } = useBooks();
  const title = siteSettings.pageBanners?.galleryTitle || DEFAULT_TITLE;
  const subtitle = siteSettings.pageBanners?.gallerySubtitle || DEFAULT_SUBTITLE;

  return (
    <div className="py-8 bg-[#FAF7F2] text-[#33231B] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Photo & Printing Press Gallery' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#6B1D3A]">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5748] font-medium mt-1">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-8">
          {gallery.map(item => (
            <div
              key={item.id}
              className="group bg-[#FFFCF7] rounded-3xl overflow-hidden border border-[#B8923A]/40 shadow-sm hover:shadow-sm transition-all"
            >
              <div className="aspect-square relative overflow-hidden bg-[#FAF7F2]">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  loading="lazy" decoding="async" />
                <span className="absolute top-3 left-3 bg-[#6B1D3A] text-[#B8923A] text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                  {item.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-serif font-bold text-sm text-[#6B1D3A]">{item.title}</h3>
                <p className="text-xs text-[#6B5748] font-medium mt-1">{item.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
