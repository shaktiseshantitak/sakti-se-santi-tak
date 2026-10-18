import { useSiteContent } from '../lib/useSiteContent';
import React, { useState } from 'react';
import { Clock, User, ArrowRight, Tag, Search } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';
import { BlogPost } from '../types';

interface BlogPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectBlog: (blog: BlogPost) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onNavigate, onSelectBlog }) => {
  const tx = useSiteContent();

  const c = useSiteContent();
  const { blogs } = useBooks();
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const filtered = blogs.filter(b => {
    if (selectedCat !== 'All' && b.category !== selectedCat) return false;
    if (search.trim() && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: c('blog.breadcrumb') }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[color:var(--c-primary)]">
            {c('blog.title')}
          </h1>
          <p className="text-xs sm:text-sm text-[color:var(--c-text-muted)] mt-1 font-medium">
            {c('blog.subtitle')}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {['All', 'Philosophy', 'Scripture Analysis', 'Devotional Practice', 'Temple Architecture'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCat === cat
                    ? 'bg-[color:var(--c-primary)] text-amber-100 shadow'
                    : 'bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] hover:bg-[color:var(--c-page)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={c('blog.search')}
              className="w-full pl-8 pr-3 py-1.5 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-xl text-xs text-[color:var(--c-text)] placeholder-[color:var(--c-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
            />
            <Search className="w-3.5 h-3.5 text-[color:var(--c-primary)] absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(post => (
            <div
              key={post.id}
              onClick={() => onSelectBlog(post)}
              className="group bg-[color:var(--c-surface)] rounded-3xl overflow-hidden border border-[color:var(--c-accent)]/40 shadow-sm hover:shadow-sm cursor-pointer transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-[color:var(--c-page)] overflow-hidden">
                  <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  loading="lazy" decoding="async" />
                  <span className="absolute top-3 left-3 bg-[color:var(--c-primary)] text-amber-100 text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                    {post.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] text-[color:var(--c-text-muted)] font-medium mb-2">
                    <User className="w-3.5 h-3.5 text-[color:var(--c-accent)]" />
                    <span>{post.authorName}</span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-[color:var(--c-accent)]" />
                    <span>{post.readTimeMinutes} {tx('t.BlogPage.c068a8a6')}</span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[color:var(--c-primary)] line-clamp-2 group-hover:text-[color:var(--c-accent)] transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[color:var(--c-text)] mt-2 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <span className="text-xs font-bold text-[color:var(--c-primary)] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {tx('t.BlogPage.3f68090a')} <ArrowRight className="w-3.5 h-3.5 text-[color:var(--c-accent)]" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
