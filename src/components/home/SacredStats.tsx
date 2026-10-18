import React from 'react';
import { BookOpen, Users, Globe2, Award } from 'lucide-react';
import { useBooks } from '../../context/BookContext';
import { useReviewStats } from '../../lib/useReviewStats';

export const SacredStats: React.FC = () => {
  const { siteSettings, books } = useBooks();
  const reviewStats = useReviewStats();
  const cfg = siteSettings?.statsBand;
  if (cfg?.enabled === false) return null;
  const icons = [
    <BookOpen className="w-8 h-8 text-amber-500" />,
    <Users className="w-8 h-8 text-amber-500" />,
    <Globe2 className="w-8 h-8 text-amber-500" />,
    <Award className="w-8 h-8 text-amber-500" />,
  ];
  // Only real values are used as fallbacks (live book count, real review
  // rating). Readers / countries have no real source in the database, so
  // those two show only if the admin types a true number in Control Panel.
  const realRating = reviewStats && reviewStats.total > 0 ? `${reviewStats.average.toFixed(1)} / 5` : '';
  const defaults = [
    { number: books.length > 0 ? String(books.length) : '', label: 'Sacred Scripture Titles Published' },
    { number: '', label: 'Devout Readers & Homes Reached' },
    { number: '', label: 'Countries Delivered Worldwide' },
    { number: realRating, label: 'Verified Scholar & Reader Rating' },
  ];
  const stats = defaults
    .map((d, i) => ({
      icon: icons[i],
      number: cfg?.items?.[i]?.number?.trim() || d.number,
      label: cfg?.items?.[i]?.label?.trim() || d.label,
    }))
    .filter(item => item.number);
  if (stats.length === 0) return null;

  return (
    <section className="py-14 bg-amber-50 dark:bg-zinc-950 border-y border-amber-200/60 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-center">
          {stats.map((item, idx) => (
            <div key={idx} className="glass-card p-6 rounded-2xl text-center space-y-2">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="font-serif text-2xl sm:text-4xl font-bold text-amber-950 dark:text-amber-300">
                {item.number}
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
