import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onHomeClick?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onHomeClick }) => {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 py-2.5 overflow-x-auto whitespace-nowrap">
      <button
        onClick={onHomeClick}
        className="flex items-center gap-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </button>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors capitalize"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize truncate max-w-[200px] sm:max-w-none">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
