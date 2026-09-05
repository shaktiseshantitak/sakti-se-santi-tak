import React from 'react';
import { User, Clock, ArrowLeft, Tag, Share2 } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BlogPost } from '../types';

interface BlogPostPageProps {
  blog: BlogPost;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ blog, onNavigate }) => {
  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[{ label: 'Blog', onClick: () => onNavigate('blog') }, { label: blog.title }]}
          onHomeClick={() => onNavigate('home')}
        />

        <button
          onClick={() => onNavigate('blog')}
          className="my-4 text-xs font-bold text-[#8B1E3F] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" /> Back to Articles
        </button>

        <article className="bg-[#FFF8EE] rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/40 shadow-sm space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">
            {blog.category}
          </span>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#8B1E3F] leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6E4E37] pb-4 border-b border-[#D4AF37]/30 font-medium">
            <span className="flex items-center gap-1 font-bold text-[#8B1E3F]">
              <User className="w-4 h-4 text-[#D4AF37]" /> {blog.authorName}
            </span>
            <span>•</span>
            <span>Published on {new Date(blog.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#D4AF37]" /> {blog.readTimeMinutes} min read
            </span>
          </div>

          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-[#F8F4E8] border border-[#D4AF37]/30">
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          </div>

          <div className="max-w-none text-xs sm:text-sm text-[#4A2C17] leading-relaxed whitespace-pre-line font-medium">
            {blog.content}
          </div>

          <div className="pt-6 border-t border-[#D4AF37]/30 flex items-center justify-between">
            <div className="flex gap-2">
              {blog.tags.map(t => (
                <span key={t} className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#8B1E3F] text-[10px] font-bold px-2.5 py-1 rounded-lg">
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
