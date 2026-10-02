import React, { useState, useEffect, useRef } from 'react';
import { X, Share2, Copy, Check, QrCode, MessageCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { Book } from '../../types';

interface QrShareModalProps {
  book: Book;
  onClose: () => void;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({ book, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const shareUrl = `${window.location.origin}/books/${book.slug}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // This QR code used to be a
  // fixed, purely decorative SVG drawing — the exact same fake pattern
  // for every single book, with no actual data encoded in it at all.
  // Scanning it did nothing because there was nothing real to scan. Now
  // it generates a genuine, scannable QR code (via the `qrcode` library)
  // that encodes this book's real shareUrl.
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 176,
        margin: 1,
        color: { dark: '#7A0016', light: '#FFFDF8' },
      }).catch(console.error);
    }
  }, [shareUrl]);

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

          {/* Real, scannable QR code — see the useEffect above */}
          <div className="my-5 p-4 bg-white rounded-xl shadow-sm border border-amber-200 inline-block">
            <canvas ref={canvasRef} className="w-44 h-44" />
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
