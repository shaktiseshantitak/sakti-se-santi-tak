import React, { useRef } from 'react';
import { Award, BookOpen, Heart, Shield, Sparkles } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';

interface AboutPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// This is the EXACT original text that used to be hardcoded directly in
// the JSX below (verified byte-identical). It now serves only as the
// DEFAULT — used for any field the admin hasn't edited in Control Panel
// yet — so nothing visually changes for a site that hasn't touched these
// new settings.
const DEFAULT_ABOUT = {
  eyebrow: 'Varanasi Publishing Heritage',
  heading: 'About Shakti Se Shanti Tak',
  subtitle:
    'Established on the holy banks of Assi Ghat in Varanasi, Shakti Se Shanti Tak (शक्ति से शांति तक) is dedicated to publishing, preserving, and distributing authentic Sanatana Dharma scriptures worldwide.',
  visionTitle: 'Our Vision & Vedic Promise',
  visionParagraph1:
    'Ancient rishis composed the Vedas, Upanishads, and Gita for the spiritual elevation of all humanity. In an era of rapid digital summaries, authentic hardbound scriptures with word-for-word Sanskrit Devanagari commentary remain the gold standard for deep study.',
  visionParagraph2:
    'Every title produced by Shakti Se Shanti Tak undergoes a rigorous multi-stage review process involving traditional Sanskrit pundits, philologists, and master bookbinders.',
  feature1Title: 'Authentic Commentary',
  feature1Text: 'Based on Adi Shankaracharya, Ramanujacharya, and traditional bhashyas.',
  feature2Title: 'Archival Quality',
  feature2Text: 'Gold embossed bindings using acid-free paper guaranteed for generations.',
  feature3Title: 'Global Distribution',
  feature3Text: 'Delivering sacred books to seekers and ashrams in 85+ countries.',
  imageUrl:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80',
  breadcrumb: 'About Our Press & Heritage',
  credit: 'Website Developed & Deployed by Mr. Sitaram Ghintala',
};

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { siteSettings } = useBooks();
  const a = siteSettings.aboutPage || {};
  const t = (key: keyof typeof DEFAULT_ABOUT) => a[key] || DEFAULT_ABOUT[key];
  // Blank/unset = default credit. Typing a single space in Control Panel hides it.
  const credit = !a.credit ? DEFAULT_ABOUT.credit : a.credit.trim();

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t('breadcrumb') }]} onHomeClick={() => onNavigate('home')} />

        <div className="w-full">
            <div className="my-6 text-center space-y-3">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[color:var(--c-primary)]">
                {t('eyebrow')}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[color:var(--c-primary)]">
                {t('heading')}
              </h1>
              <p className="text-xs sm:text-sm text-[color:var(--c-text-muted)] max-w-xl mx-auto leading-relaxed font-medium">
                {t('subtitle')}
              </p>
            </div>

            <div className="bg-[color:var(--c-surface)] rounded-3xl p-8 border border-[color:var(--c-accent)]/40 shadow-sm space-y-8 my-8">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-[color:var(--c-accent)]/40">
                <img
                  src={t('imageUrl')}
                  alt="Assi Ghat Varanasi Printing"
                  className="w-full h-full object-cover"  loading="lazy" decoding="async" />
              </div>

              <div className="max-w-none text-xs sm:text-sm text-[color:var(--c-text)] leading-relaxed space-y-4 font-medium">
                <h3 className="font-serif text-xl font-bold text-[color:var(--c-primary)]">
                  {t('visionTitle')}
                </h3>
                <p>
                  {t('visionParagraph1')}
                </p>
                <p>
                  {t('visionParagraph2')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[color:var(--c-accent)]/30 text-center">
                <div className="space-y-2">
                  <Shield className="w-8 h-8 text-[color:var(--c-accent)] mx-auto" />
                  <h4 className="font-serif font-bold text-sm text-[color:var(--c-primary)]">{t('feature1Title')}</h4>
                  <p className="text-xs text-[color:var(--c-text-muted)]">{t('feature1Text')}</p>
                </div>

                <div className="space-y-2">
                  <Award className="w-8 h-8 text-[color:var(--c-accent)] mx-auto" />
                  <h4 className="font-serif font-bold text-sm text-[color:var(--c-primary)]">{t('feature2Title')}</h4>
                  <p className="text-xs text-[color:var(--c-text-muted)]">{t('feature2Text')}</p>
                </div>

                <div className="space-y-2">
                  <Heart className="w-8 h-8 text-[color:var(--c-accent)] mx-auto" />
                  <h4 className="font-serif font-bold text-sm text-[color:var(--c-primary)]">{t('feature3Title')}</h4>
                  <p className="text-xs text-[color:var(--c-text-muted)]">{t('feature3Text')}</p>
                </div>
              </div>

              {credit && (
                <p className="text-center text-[11px] text-[color:var(--c-text-muted)]/70 pt-4 border-t border-[color:var(--c-accent)]/20">
                  {credit}
                </p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};
