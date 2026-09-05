import React from 'react';
import { Clock, User, ArrowRight, BookOpen } from 'lucide-react';
import { BlogPost } from '../../types';

interface LatestBlogsProps {
  blogs: BlogPost[];
  onSelectBlog: (blog: BlogPost) => void;
  onViewAllClick: () => void;
}

export const LatestBlogs: React.FC<LatestBlogsProps> = ({
  blogs,
  onSelectBlog,
  onViewAllClick,
}) => {
  return (
    <section className="py-16 bg-[#F8F4E8] text-[#4A2C17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold text-[#8B1E3F] uppercase tracking-widest block mb-1">
              आध्यात्मिक लेख एवं वैदिक विचार (Articles & Discourse)
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#8B1E3F]">
              आध्यात्मिक ब्लॉग एवं लेख
            </h2>
          </div>

          <button
            onClick={onViewAllClick}
            className="text-xs font-bold text-[#8B1E3F] hover:underline flex items-center gap-1 mt-2 md:mt-0"
          >
            सभी लेख पढ़ें →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.slice(0, 3).map(blog => (
            <div
              key={blog.id}
              onClick={() => onSelectBlog(blog)}
              className="group bg-[#FFF8EE] rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-sm hover:shadow-sm hover:border-[#D4AF37] cursor-pointer transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#F8F4E8]">
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"  loading="lazy" decoding="async" />
                  <span className="absolute top-3 left-3 bg-[#8B1E3F] text-amber-100 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shadow">
                    {blog.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 text-[11px] text-[#6E4E37] mb-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#8B1E3F]" /> {blog.authorName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#8B1E3F]" /> {blog.readTimeMinutes} min read
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#8B1E3F] line-clamp-2 group-hover:text-[#66122C] transition-colors leading-snug">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-[#4A2C17] mt-2 line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <span className="text-xs font-bold text-[#8B1E3F] group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform">
                  पूरा लेख पढ़ें <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
