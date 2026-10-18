import React from 'react';
import { SETTINGS_NAV, SettingsSubTabId } from './settingsNav';

interface Props {
  active: SettingsSubTabId;
  onChange: (id: SettingsSubTabId) => void;
  /** Small count badges, e.g. { popups: 3, custom_pages: 2, media: 14 } */
  counts?: Partial<Record<SettingsSubTabId, number>>;
}

/** Grouped, keyboard-friendly navigation for Site Settings. */
export const SettingsSubNav: React.FC<Props> = ({ active, onChange, counts = {} }) => (
  <nav aria-label="Site settings sections" className="space-y-3">
    {SETTINGS_NAV.map(group => (
      <div key={group.label} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
        <span className="shrink-0 sm:w-32 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {group.label}
        </span>
        <div role="tablist" aria-label={group.label} className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          {group.items.map(item => {
            const isActive = item.id === active;
            const n = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                title={item.hint}
                onClick={() => onChange(item.id)}
                className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-zinc-900 font-black shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <span aria-hidden="true">{item.icon} </span>{item.label}
                {typeof n === 'number' && <span className="ml-1 opacity-70">({n})</span>}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);
