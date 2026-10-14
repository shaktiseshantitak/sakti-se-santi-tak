import React, { useState } from 'react';
import { Menu, X, ExternalLink, LogOut } from 'lucide-react';
import { ADMIN_NAV, getAdminSection, type AdminSectionId } from './adminNav';

interface Props {
  activeTab: string;
  onTabChange: (id: AdminSectionId) => void;
  /** Optional count badges, e.g. { books: 3, orders: 12 }. */
  badges?: Partial<Record<AdminSectionId, number>>;
  onViewSite: () => void;
}

const NavList: React.FC<Props & { onPick?: () => void }> = ({ activeTab, onTabChange, badges, onPick }) => (
  <nav aria-label="Control Panel sections" className="space-y-5">
    {ADMIN_NAV.map(group => (
      <div key={group.label}>
        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#E3C77E]/60">{group.label}</p>
        <ul className="space-y-0.5">
          {group.sections.map(sec => {
            const active = activeTab === sec.id;
            const Icon = sec.icon;
            const count = badges?.[sec.id];
            return (
              <li key={sec.id}>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => { onTabChange(sec.id); onPick?.(); }}
                  className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    active
                      ? 'bg-[#B8923A] text-[#2B1B14] shadow-sm'
                      : 'text-amber-50/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[#2B1B14]' : 'text-[#E3C77E]'}`} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold leading-tight truncate">{sec.label}</span>
                    <span className={`block text-[10px] leading-tight ${active ? 'text-[#2B1B14]/70' : 'text-amber-100/50'}`}>{sec.hint}</span>
                  </span>
                  {typeof count === 'number' && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-[#2B1B14]/15 text-[#2B1B14]' : 'bg-white/10 text-amber-100'}`}>{count}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

export const AdminSidebar: React.FC<Props> = props => {
  const [open, setOpen] = useState(false);
  const current = getAdminSection(props.activeTab);

  const Footer = (
    <div className="pt-4 mt-4 border-t border-white/10">
      <button type="button" onClick={props.onViewSite} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-50/85 hover:bg-white/10 text-[13px] font-semibold">
        <ExternalLink className="w-[18px] h-[18px] text-[#E3C77E]" /> View website
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-[#3F0E21] text-white sticky top-0 h-screen overflow-y-auto px-3 py-6">
        <div className="px-3 pb-5 mb-5 border-b border-white/10">
          <p className="font-serif text-lg font-bold text-[#E3C77E] leading-tight">Shakti Se Shanti Tak</p>
          <p className="text-[11px] text-amber-100/60 mt-0.5">Control Panel</p>
        </div>
        <NavList {...props} />
        {Footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#3F0E21] text-white flex items-center gap-3 px-4 py-3 shadow">
        <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-serif font-bold text-[#E3C77E] text-sm truncate">{current.title}</span>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85%] bg-[#3F0E21] text-white h-full overflow-y-auto px-3 py-5">
            <div className="flex items-center justify-between px-3 pb-4 mb-4 border-b border-white/10">
              <div>
                <p className="font-serif text-base font-bold text-[#E3C77E]">Shakti Se Shanti Tak</p>
                <p className="text-[11px] text-amber-100/60">Control Panel</p>
              </div>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <NavList {...props} onPick={() => setOpen(false)} />
            {Footer}
          </div>
        </div>
      )}
    </>
  );
};
