import React, { useState } from 'react';
import { Sparkles, Play, Video, BookOpen, Sun, Heart, Flame, Shield, Droplet, Star, ShoppingCart, CheckCircle, ArrowRight } from 'lucide-react';
import { Book } from '../../types';
import { NO_IMAGE_PLACEHOLDER } from '../../lib/placeholderImage';
import { useBooks } from '../../context/BookContext';
import { getYoutubeEmbedUrl, extractYoutubeVideoId } from '../../utils/youtube';
import { useSiteContent } from '../../lib/useSiteContent';
import { RichText } from '../common/RichText';
import { cleanContentLists, resolveContentList } from '../../utils/contentLists';

interface GayatriSecretsSectionProps {
  onBuyNow: (book?: Book) => void;
  shaktiBook?: Book;
}

export const GayatriSecretsSection: React.FC<GayatriSecretsSectionProps> = ({
  onBuyNow,
  shaktiBook,
}) => {
  const tx = useSiteContent();

  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const { siteSettings } = useBooks();
  const c = useSiteContent();
  const articles = resolveContentList(cleanContentLists(siteSettings?.contentLists), 'gayatriArticles');
  const articleIcons = [Sparkles, Sun, Heart, Droplet, Shield, Flame, Star, BookOpen];
  // Only a valid YouTube link set in Control Panel shows the video box.
  const rawVideoUrl = siteSettings?.pageBanners?.gayatriVideoUrl || '';
  const videoId = extractYoutubeVideoId(rawVideoUrl);
  const videoEmbedUrl = videoId ? getYoutubeEmbedUrl(rawVideoUrl, { autoplay: true }) : '';
  // Real thumbnail of the admin's own video (id is a validated 11-character YouTube id)
  const videoThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : NO_IMAGE_PLACEHOLDER;

  return (
    <section className="py-16 bg-gradient-to-b from-zinc-900 via-red-950 to-zinc-950 text-amber-50 relative overflow-hidden">
      {/* Background Decorative Mandala Rays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(217,119,6,0.15),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>{c('gayatri.badge')}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-amber-100 leading-tight">
            {c('gayatri.titleA')} <span className="text-amber-400">{c('gayatri.titleB')}</span>
          </h2>

          <p className="text-xs sm:text-base text-amber-200/80 font-light">
            {c('gayatri.subtitle')}
          </p>
        </div>

        {/* Articles (add / edit / delete from Control Panel) */}
        {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art, idx) => {
              const Icon = articleIcons[idx % articleIcons.length];
              const wide = idx === articles.length - 1 && articles.length % 3 === 2;
              return (
                <div key={idx} className={`bg-zinc-900/90 border border-amber-500/30 p-6 rounded-3xl hover:border-amber-400 transition-all space-y-4 shadow-sm ${wide ? 'md:col-span-2 lg:col-span-2' : ''}`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  {art.title && (
                    <h3 className="font-serif font-bold text-xl text-amber-200 leading-snug">
                      <RichText text={art.title} />
                    </h3>
                  )}
                  {art.body && (
                    <p className="text-xs sm:text-sm text-amber-100/85 leading-relaxed whitespace-pre-line">
                      <RichText text={art.body} />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Embedded Video Section for Gayatri Mantra & Inner Journey Secrets */}
        {videoEmbedUrl && (
        <div className="bg-gradient-to-r from-red-950 via-amber-950 to-zinc-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/60 border border-red-500/40 text-amber-300 text-xs font-bold">
              <Video className="w-4 h-4 text-amber-400" />
              <span>{c('gayatri.videoBadge')}</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-amber-100 leading-tight">
              {c('gayatri.videoTitle')}
            </h3>

            <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
              {c('gayatri.videoText')}
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-amber-400 flex-wrap">
              <span>{c('gayatri.videoFact1')}</span>
              <span>•</span>
              <span>{c('gayatri.videoFact2')}</span>
              <span>•</span>
              <span>{c('gayatri.videoFact3')}</span>
            </div>
          </div>

          {/* Video Thumbnail with Play Button */}
          <div className="relative w-full md:w-80 aspect-video rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-sm group cursor-pointer shrink-0"
               onClick={() => setIsVideoModalOpen(true)}>
            <img
              src={videoThumb}
              alt="Video thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-red-950 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            </div>
            {c('gayatri.videoDuration') && (
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {c('gayatri.videoDuration')}
              </span>
            )}
          </div>

        </div>

        )}

        {/* Video Player Modal */}
        {videoEmbedUrl && isVideoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-sm relative">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <h4 className="font-serif font-bold text-lg text-amber-200">
                  {c('gayatri.videoClose')}
                </h4>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="text-amber-400 hover:text-white font-bold text-xl px-2"
                >
                  ✕
                </button>
              </div>

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-amber-500/30">
                <iframe
                  className="w-full h-full"
                  src={videoEmbedUrl}
                  title={tx('t.GayatriSecretsSection.c289e050')}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2 rounded-xl"
                >
                  {tx('t.GayatriSecretsSection.e2434dbe')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Buy Now CTA */}
        <div className="text-center pt-4">
          <button
            onClick={() => onBuyNow(shaktiBook)}
            className="bg-amber-500 hover:bg-amber-400 text-red-950 font-extrabold text-base px-9 py-4 rounded-2xl shadow-sm shadow-amber-500/30 inline-flex items-center gap-3 transition-transform active:scale-95 border border-amber-300"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{c('gayatri.buy')}</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </div>

      </div>
    </section>
  );
};
