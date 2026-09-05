import React from 'react';
import { BookOpen, Users, Globe2, Award } from 'lucide-react';

export const SacredStats: React.FC = () => {
  const stats = [
    { icon: <BookOpen className="w-8 h-8 text-amber-500" />, number: '500+', label: 'Sacred Scripture Titles Published' },
    { icon: <Users className="w-8 h-8 text-amber-500" />, number: '150,000+', label: 'Devout Readers & Homes Reached' },
    { icon: <Globe2 className="w-8 h-8 text-amber-500" />, number: '85+', label: 'Countries Delivered Worldwide' },
    { icon: <Award className="w-8 h-8 text-amber-500" />, number: '4.95 / 5', label: 'Verified Scholar & Reader Rating' },
  ];

  return (
    <section className="py-14 bg-amber-50 dark:bg-zinc-950 border-y border-amber-200/60 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
