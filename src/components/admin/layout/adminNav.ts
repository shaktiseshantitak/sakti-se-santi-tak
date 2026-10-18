import {
  LayoutDashboard, BookOpen, Tags, ShoppingCart, Users, TicketPercent, Handshake,
  FileText, Image as ImageIcon, MessageSquareQuote, Radio, Settings, Search, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

/** Every Control Panel section. `id` matches the page's `activeTab` value. */
export type AdminSectionId =
  | 'dashboard' | 'books' | 'categories' | 'orders' | 'customers' | 'coupons' | 'affiliates'
  | 'blogs' | 'gallery' | 'reviews' | 'livestream' | 'settings' | 'seo' | 'security';

export interface AdminSection {
  id: AdminSectionId;
  label: string;
  /** Short Hindi hint shown under the label. */
  hint: string;
  /** Heading + one-line description shown at the top of the section. */
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  label: string;
  sections: AdminSection[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Overview',
    sections: [
      { id: 'dashboard', label: 'Dashboard', hint: 'डैशबोर्ड', title: 'Dashboard', description: 'Sales, orders and stock at a glance.', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catalog',
    sections: [
      { id: 'books', label: 'Books', hint: 'पुस्तकें', title: 'Books', description: 'Add, edit and price the books on sale.', icon: BookOpen },
      { id: 'categories', label: 'Categories', hint: 'श्रेणियां', title: 'Categories', description: 'Organise the catalog into categories.', icon: Tags },
    ],
  },
  {
    label: 'Sales',
    sections: [
      { id: 'orders', label: 'Orders', hint: 'ऑर्डर', title: 'Orders', description: 'Track payments, dispatch and delivery.', icon: ShoppingCart },
      { id: 'customers', label: 'Customers', hint: 'ग्राहक', title: 'Customers', description: 'Customer directory and account status.', icon: Users },
      { id: 'coupons', label: 'Coupons', hint: 'कूपन', title: 'Coupons', description: 'Discount codes and their rules.', icon: TicketPercent },
      { id: 'affiliates', label: 'Affiliates', hint: 'एफिलिएट', title: 'Affiliate Programme', description: 'Partners, referrals, commissions and payouts.', icon: Handshake },
    ],
  },
  {
    label: 'Content',
    sections: [
      { id: 'blogs', label: 'Blog', hint: 'ब्लॉग', title: 'Blog', description: 'Articles and spiritual news.', icon: FileText },
      { id: 'gallery', label: 'Gallery', hint: 'गैलरी', title: 'Gallery', description: 'Photos and press-printing gallery.', icon: ImageIcon },
      { id: 'reviews', label: 'Reviews & Testimonials', hint: 'समीक्षाएं', title: 'Reviews & Testimonials', description: 'Moderate reviews and manage home-page testimonials.', icon: MessageSquareQuote },
      { id: 'livestream', label: 'Live Stream', hint: 'लाइव', title: 'Live Stream', description: 'Live satsang studio and stream details.', icon: Radio },
    ],
  },
  {
    label: 'Website',
    sections: [
      { id: 'settings', label: 'Site Settings', hint: 'सेटिंग्स', title: 'Site Settings', description: 'Brand, shipping, texts, home page, pages and backups.', icon: Settings },
      { id: 'seo', label: 'SEO', hint: 'एसईओ', title: 'SEO & Google', description: 'Search-engine and indexing settings.', icon: Search },
    ],
  },
  {
    label: 'Security',
    sections: [
      { id: 'security', label: 'Security', hint: 'सुरक्षा', title: 'Security', description: 'Admin access, audit log and protection status.', icon: ShieldCheck },
    ],
  },
];

export const ADMIN_SECTIONS: AdminSection[] = ADMIN_NAV.flatMap(g => g.sections);

export const getAdminSection = (id: string): AdminSection =>
  ADMIN_SECTIONS.find(s => s.id === id) || ADMIN_SECTIONS[0];
