import React, { useState } from 'react';
import { X, Share2, Copy, Check, QrCode, MessageCircle } from 'lucide-react';
import { Book } from '../../types';

interface QrShareModalProps {
  book: Book;
  onClose: () => void;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({ book, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const shareUrl = `${window.location.origin}/books/${book.slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `🙏🏻 Namaste! Check out this sacred book on Shakti Se Shanti Tak (shaktiseshanti.com): "${book.title}" by ${book.authorName}. Price: ₹${book.offerPrice} (MRP ₹${book.mrp}). Order now: ${shareUrl}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-full max-w-sm rounded-2xl shadow-sm p-6 border border-amber-500/30 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">
            Share & Scan for Quick Order
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[260px]">
            Scan with your mobile camera or WhatsApp to view and order {book.title}.
          </p>

          {/* Generated SVG QR Code representation */}
          <div className="my-5 p-4 bg-white rounded-xl shadow-sm border border-amber-200 inline-block">
            <svg
              className="w-44 h-44"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer border & finder patterns */}
              <rect x="5" y="5" width="90" height="90" rx="6" fill="#FFFDF8" stroke="#B45309" strokeWidth="2" />
              <rect x="12" y="12" width="24" height="24" fill="#7A0016" rx="3" />
              <rect x="16" y="16" width="16" height="16" fill="#FFF" />
              <rect x="20" y="20" width="8" height="8" fill="#7A0016" />

              <rect x="64" y="12" width="24" height="24" fill="#7A0016" rx="3" />
              <rect x="68" y="16" width="16" height="16" fill="#FFF" />
              <rect x="72" y="20" width="8" height="8" fill="#7A0016" />

              <rect x="12" y="64" width="24" height="24" fill="#7A0016" rx="3" />
              <rect x="16" y="68" width="16" height="16" fill="#FFF" />
              <rect x="20" y="72" width="8" height="8" fill="#7A0016" />

              {/* Simulated QR matrix elements */}
              <path d="M42 15h6v6h-6zM52 15h6v6h-6zM42 25h16v6H42zM15 42h6v16h-6zM25 42h6v6h-6zM35 42h6v12h-6zM45 42h16v6H45zM65 42h6v16h-6zM75 42h10v6H75z" fill="#D97706" />
              <path d="M42 62h6v6h-6zM52 62h12v6H52zM68 62h16v6H68zM42 72h6v16h-6zM52 75h8v8h-8zM65 72h10v6H65zM78 78h6v10h-6z" fill="#7A0016" />

              {/* Center Om symbol */}
              <circle cx="50" cy="50" r="10" fill="#FFF" stroke="#D97706" strokeWidth="1.5" />
              <text x="50" y="53.5" fontSize="10" textAnchor="middle" fill="#B45309" fontWeight="bold">ॐ</text>
            </svg>
          </div>

          <div className="flex items-center gap-2 w-full">
            <a
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Share</span>
            </a>

            <button
              onClick={copyToClipboard}
              className="bg-amber-100 dark:bg-zinc-800 hover:bg-amber-200 dark:hover:bg-zinc-700 text-amber-900 dark:text-amber-300 font-semibold py-2 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
