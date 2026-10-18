import { useSiteContent } from '../lib/useSiteContent';
import React from 'react';
import { User, Clock, ArrowLeft, Tag, Share2 } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BlogPost } from '../types';

interface BlogPostPageProps {
  blog: BlogPost;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ blog, onNavigate }) => {
  const tx = useSiteContent();

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: tx('crumb.blog'), onClick: () => onNavigate('blog') }, { label: blog.title }]}
          onHomeClick={() => onNavigate('home')}
        />

        <button
          onClick={() => onNavigate('blog')}
          className="my-4 text-xs font-bold text-[color:var(--c-primary)] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[color:var(--c-accent)]" /> {tx('t.BlogPostPage.2fc6815e')}
        </button>

        <article className="bg-[color:var(--c-surface)] rounded-3xl p-6 sm:p-10 border border-[color:var(--c-accent)]/40 shadow-sm space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--c-primary)]">
            {blog.category}
          </span>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[color:var(--c-primary)] leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[color:var(--c-text-muted)] pb-4 border-b border-[color:var(--c-accent)]/30 font-medium">
            <span className="flex items-center gap-1 font-bold text-[color:var(--c-primary)]">
              <User className="w-4 h-4 text-[color:var(--c-accent)]" /> {blog.authorName}
            </span>
            <span>•</span>
            <span>{tx('t.BlogPostPage.e5d27b16')} {new Date(blog.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[color:var(--c-accent)]" /> {blog.readTimeMinutes} {tx('t.BlogPostPage.7c4132e5')}
            </span>
          </div>

          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/30">
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          </div>

          <div className="max-w-none text-xs sm:text-sm text-[color:var(--c-text)] leading-relaxed whitespace-pre-line font-medium">
            {blog.content}
          </div>

          <div className="pt-6 border-t border-[color:var(--c-accent)]/30 flex items-center justify-between">
            <div className="flex gap-2">
              {blog.tags.map(t => (
                <span key={t} className="bg-[color:var(--c-accent)]/20 border border-[color:var(--c-accent)]/40 text-[color:var(--c-primary)] text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
