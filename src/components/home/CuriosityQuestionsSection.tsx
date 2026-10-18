import React, { useState } from 'react';
import { HelpCircle, Sparkles, Key, Zap, ShieldAlert, ShoppingCart, ArrowRight, Brain, Compass, Flame } from 'lucide-react';
import { Book } from '../../types';
import { useBooks } from '../../context/BookContext';
import { useSiteContent } from '../../lib/useSiteContent';
import { RichText } from '../common/RichText';
import { cleanContentLists, resolveContentList } from '../../utils/contentLists';

interface CuriosityQuestionsSectionProps {
  onBuyNow: (book?: Book) => void;
  shaktiBook?: Book;
}

export const CuriosityQuestionsSection: React.FC<CuriosityQuestionsSectionProps> = ({
  onBuyNow,
  shaktiBook,
}) => {
  const [activeQuestion, setActiveQuestion] = useState<number>(0);

  const { siteSettings } = useBooks();
  const t = useSiteContent();
  const lists = cleanContentLists(siteSettings?.contentLists);
  const questionIcons = [HelpCircle, Key, Compass, Sparkles, Flame, Brain];
  const conceptIcons = [Zap, Brain, ShieldAlert, Sparkles, Key, Compass];
  const questionsData = resolveContentList(lists, 'curiosityQuestions').map((q, i) => ({
    id: i + 1, question: q.title, answer: q.body, icon: questionIcons[i % questionIcons.length],
  }));
  const concepts = resolveContentList(lists, 'curiosityConcepts');

  // Price line uses the LIVE book price (never a typed-in number): {price} {mrp} {title}
  const price = shaktiBook?.offerPrice ?? 0;
  const mrp = shaktiBook?.mrp ?? 0;
  let priceLine = t('curiosity.ctaPrice');
  if (!(mrp > price)) priceLine = priceLine.replace(/\s*\([^()]*\{mrp\}[^()]*\)/, '');
  priceLine = priceLine
    .split('{price}').join(String(price))
    .split('{mrp}').join(String(mrp))
    .split('{title}').join(shaktiBook?.title || '');
  const showPriceLine = price > 0 && priceLine.trim() !== '';

  return (
    <section className="py-16 bg-amber-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-amber-50 relative overflow-hidden">
      {/* Subtle Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(185,28,28,0.06),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-900/10 dark:bg-red-950/60 border border-red-500/30 text-red-800 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-red-600 dark:text-amber-400 animate-pulse" />
            <span>{t('curiosity.badge')}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-red-950 dark:text-amber-100 leading-tight">
            {t('curiosity.titleA')} <span className="text-red-700 dark:text-amber-400">{t('curiosity.titleB')}</span>
          </h2>

          <p className="text-sm sm:text-base text-zinc-700 dark:text-amber-200/80">
            {t('curiosity.subtitle')}
          </p>
        </div>

        {/* 3 Interactive Big Curiosity Questions Cards */}
        {questionsData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {questionsData.map((q, idx) => {
            const Icon = q.icon;
            const isSelected = activeQuestion === idx;
            return (
              <div
                key={q.id}
                onClick={() => setActiveQuestion(idx)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-gradient-to-br from-red-900 to-amber-950 text-amber-50 border-amber-400 shadow-sm scale-[1.02]'
                    : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-amber-100 border-amber-500/20 hover:border-amber-500/50 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-amber-500 text-red-950' : 'bg-red-900/10 dark:bg-amber-500/20 text-red-700 dark:text-amber-400'
                    }`}>
                      {String(q.id).padStart(2, '0')}
                    </span>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-amber-400' : 'text-red-700 dark:text-amber-400'}`} />
                  </div>

                  <h3 className="font-serif font-bold text-lg leading-snug">
                    <RichText text={q.question} />
                  </h3>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isSelected ? 'text-amber-100/90' : 'text-zinc-600 dark:text-amber-200/70'
                }`}>
                  <RichText text={q.answer} />
                </p>

                <div className="pt-2">
                  <span className={`text-xs font-bold inline-flex items-center gap-1 ${
                    isSelected ? 'text-amber-400' : 'text-red-700 dark:text-amber-400'
                  }`}>
                    {isSelected ? t('curiosity.cardOpen') : t('curiosity.cardClosed')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Detailed Concepts Breakdown: Physical Paradox, Scientific Depth & Protection Shield */}
        <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 text-amber-50 p-8 sm:p-10 rounded-3xl border-2 border-amber-500/40 shadow-sm space-y-8">
          
          {concepts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-amber-500/20 pb-8">
            {concepts.map((cn, idx) => {
              const CIcon = conceptIcons[idx % conceptIcons.length];
              return (
                <div key={idx} className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <CIcon className="w-6 h-6" />
                  </div>
                  {cn.title && (
                    <h3 className="font-serif font-bold text-xl text-amber-200">
                      <RichText text={cn.title} />
                    </h3>
                  )}
                  {cn.body && (
                    <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
                      <RichText text={cn.body} />
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Section CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div>
              <p className="font-serif font-bold text-lg text-amber-100">
                {t('curiosity.ctaTitle')}
              </p>
              {showPriceLine && <p className="text-xs text-amber-300/80">{priceLine}</p>}
            </div>

            <button
              onClick={() => onBuyNow(shaktiBook)}
              className="bg-amber-500 hover:bg-amber-400 text-red-950 font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-sm shadow-amber-500/30 flex items-center gap-2 shrink-0 transition-transform active:scale-95 border border-amber-300"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('curiosity.ctaButton')}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
