import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';

interface GalleryPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
  const { gallery } = useBooks();

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Photo & Printing Press Gallery' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F]">
            Printing Press & Temple Seva Photo Gallery
          </h1>
          <p className="text-xs sm:text-sm text-[#6E4E37] font-medium mt-1">
            Visual moments from Varanasi manuscript gilding, book releases, and scripture donation drives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-8">
          {gallery.map(item => (
            <div
              key={item.id}
              className="group bg-[#FFF8EE] rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-sm hover:shadow-sm transition-all"
            >
              <div className="aspect-square relative overflow-hidden bg-[#F8F4E8]">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  loading="lazy" decoding="async" />
                <span className="absolute top-3 left-3 bg-[#8B1E3F] text-[#D4AF37] text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                  {item.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-serif font-bold text-sm text-[#8B1E3F]">{item.title}</h3>
                <p className="text-xs text-[#6E4E37] font-medium mt-1">{item.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
