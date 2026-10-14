import React from 'react';
import { getAdminSection } from './adminNav';

interface Props {
  activeTab: string;
  /** Buttons shown on the right (primary action first). */
  children?: React.ReactNode;
}

/** The title block at the top of every Control Panel section. */
export const AdminPageHeader: React.FC<Props> = ({ activeTab, children }) => {
  const sec = getAdminSection(activeTab);
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#B8923A]/30">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#6B1D3A]">{sec.title}</h1>
        <p className="text-sm text-[#6B5748] mt-0.5">{sec.description}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
};
