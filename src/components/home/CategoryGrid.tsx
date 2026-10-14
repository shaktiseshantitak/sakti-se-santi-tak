import React from 'react';
import {
  BookOpen, Shield, Scroll, Flame, Sparkles, Bookmark,
  Sun, Heart, Compass, Smile, ArrowRight
} from 'lucide-react';
import { Category } from '../../types';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (slug: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Scroll: <Scroll className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Bookmark: <Bookmark className="w-6 h-6" />,
  Sun: <Sun className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Compass: <Compass className="w-6 h-6" />,
  Smile: <Smile className="w-6 h-6" />,
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelectCategory }) => {
  return (
    <section className="py-16 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-1">
              Explore by Canonical Subject
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              Sacred Scripture Categories
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-2 md:mt-0">
            From the core 700 verses of Bhagavad Gita to the 108 Principal Upanishads and daily Stotras.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="group relative glass-card p-5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all">
                {ICON_MAP[cat.iconName] || <BookOpen className="w-6 h-6" />}
              </div>

              <div>
                <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {cat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-400">
                <span>{cat.bookCount || 10}+ Titles</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
