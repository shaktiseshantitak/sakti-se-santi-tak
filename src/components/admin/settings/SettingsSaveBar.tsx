import React from 'react';
import { Save } from 'lucide-react';

/** Always-visible Save button at the bottom of the settings form (long sections no longer need a scroll back to the top). */
export const SettingsSaveBar: React.FC = () => (
  <div className="sticky bottom-0 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 rounded-b-3xl">
    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
      सभी सेक्शन के बदलाव एक साथ सुरक्षित होते हैं।
    </p>
    <button
      type="submit"
      className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2 shrink-0"
    >
      <Save className="w-4 h-4" />
      <span>बदलाव सुरक्षित करें (Save)</span>
    </button>
  </div>
);
