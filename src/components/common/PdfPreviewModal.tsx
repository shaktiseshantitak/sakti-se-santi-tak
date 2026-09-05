import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, BookOpen, Download, Lock } from 'lucide-react';
import { Book } from '../../types';

interface PdfPreviewModalProps {
  book: Book;
  onClose: () => void;
  onBuyClick: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  book,
  onClose,
  onBuyClick,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const totalSamplePages = Math.min(15, book.pages);

  // Sample page text generator for sacred scriptures
  const getPageSampleContent = (pageNum: number) => {
    if (pageNum === 1) {
      return {
        chapter: 'Title Page & Mangalacharan',
        sanskrit: 'ॐ श्रीपरमात्मने नमः ॥ श्रीगणेशाय नमः ॥',
        english: 'Invocation to the Supreme Divine & Lord Sri Ganesha',
        text: `Om Namo Bhagavate Vasudevaya. May this holy scripture bring divine light, clarity of mind, and moral strength to all readers across the globe.

Title: ${book.title}
Author / Commentator: ${book.authorName}
Publisher: ${book.publisher} (${book.publicationYear})
ISBN: ${book.isbn}`,
      };
    }
    if (pageNum === 2) {
      return {
        chapter: 'Publisher’s Foreword & Sanctity',
        sanskrit: 'धर्मो रक्षति रक्षितः ॥',
        english: 'Dharma protects those who protect Dharma',
        text: `This edition has been meticulously collated from authentic palm-leaf manuscripts and verified by Vedantic Acharyas in Varanasi. 

Every word, accent, and punctuation mark adheres strictly to classical Sanskrit grammar and traditional exposition.`,
      };
    }
    const toc = book.tableOfContents;
    const item = toc && toc[(pageNum - 3) % toc.length];
    return {
      chapter: item ? item.title : `Sample Page ${pageNum}`,
      sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥',
      english: 'Whenever there is a decline in righteousness and a rise of unrighteousness, I manifest Myself.',
      text: `In this section, the text delves into profound spiritual truths, guiding the human spirit through duty (Karma), devotion (Bhakti), and supreme wisdom (Jnana). 

The commentary illuminates subtle Sanskrit terms, ensuring clarity for modern readers while preserving ancient sanctity.`,
    };
  };

  const sampleData = getPageSampleContent(currentPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 overflow-hidden">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl h-[88vh] rounded-2xl shadow-sm flex flex-col overflow-hidden border border-amber-500/30">
        {/* Top Header Bar */}
        <div className="bg-amber-900 text-amber-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="truncate">
              <h3 className="font-semibold text-sm sm:text-base text-amber-100 truncate">
                {book.title}
              </h3>
              <p className="text-xs text-amber-300">
                Sample Reader Preview • Page {currentPage} of {totalSamplePages}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-amber-950/60 rounded-lg p-1 text-xs">
              <button
                onClick={() => setZoom(z => Math.max(80, z - 10))}
                className="p-1 hover:text-amber-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-amber-300">{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(130, z + 10))}
                className="p-1 hover:text-amber-400"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onBuyClick}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Buy Full Book</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-amber-800 rounded-lg text-amber-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Viewer */}
        <div className="flex-1 bg-amber-50/50 dark:bg-zinc-950 p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/40 shadow-sm rounded-xl p-6 sm:p-10 transition-transform duration-200 text-zinc-900 dark:text-zinc-100"
          >
            {/* Header Motif */}
            <div className="text-center pb-4 mb-6 border-b border-amber-200 dark:border-amber-900/30">
              <span className="text-2xl text-amber-600 dark:text-amber-400 font-serif">ॐ</span>
              <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold mt-1">
                {sampleData.chapter}
              </p>
            </div>

            {/* Sacred Verses Sample */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-600 p-4 rounded-r-lg my-4 text-center">
              <p className="font-serif text-lg sm:text-xl text-amber-900 dark:text-amber-200 leading-relaxed font-semibold">
                {sampleData.sanskrit}
              </p>
              <p className="text-xs italic text-amber-700 dark:text-amber-300 mt-2">
                "{sampleData.english}"
              </p>
            </div>

            {/* Body Text */}
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
              {sampleData.text}
            </div>

            {/* Locked Preview Banner if at end of sample */}
            {currentPage === totalSamplePages && (
              <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  You have reached the end of the free sample pages ({totalSamplePages} pages).
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 mb-3">
                  Purchase the complete edition ({book.pages} pages) in Hardcover, Paperback, or PDF E-Book format to unlock all chapters.
                </p>
                <button
                  onClick={onBuyClick}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm"
                >
                  Buy Complete Book (₹{book.offerPrice})
                </button>
              </div>
            )}

            {/* Page Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-xs text-zinc-400">
              <span>{book.title}</span>
              <span>Page {currentPage} of {book.pages}</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Page {currentPage} / {totalSamplePages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalSamplePages, p + 1))}
            disabled={currentPage === totalSamplePages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 text-white disabled:opacity-40 hover:bg-amber-700 transition-colors shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
