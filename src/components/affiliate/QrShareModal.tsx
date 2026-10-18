import { useSiteContent } from '../../lib/useSiteContent';
import React from 'react';
import { X, Copy, Check, QrCode, Share2 } from 'lucide-react';

interface QrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralUrl: string;
  referralCode: string;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({
  isOpen,
  onClose,
  referralUrl,
  referralCode,
}) => {
  const tx = useSiteContent();

  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate SVG QR Code API endpoint
  const qrCodeImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    referralUrl
  )}&color=8B1E3F&bgcolor=FFF8EE`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/50 w-full max-w-sm rounded-3xl p-6 shadow-sm space-y-4 relative text-center text-[color:var(--c-text)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[color:var(--c-primary)] hover:bg-amber-100 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[color:var(--c-primary)]/10 text-[color:var(--c-primary)] flex items-center justify-center mx-auto border border-[color:var(--c-primary)]/20">
          <QrCode className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)]">
            {tx('t.QrShareModal.100cffdd')}
          </h3>
          <p className="text-xs text-[color:var(--c-text-muted)]">
            {tx('t.QrShareModal.aeeb1ae9')} <strong className="text-[color:var(--c-primary)]">{referralCode}</strong>
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[color:var(--c-accent)]/30 inline-block shadow-xs">
          <img
            src={qrCodeImg}
            alt="Referral QR Code"
            className="w-48 h-48 object-contain mx-auto rounded-lg"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="p-2.5 bg-[color:var(--c-page)] rounded-xl border border-[color:var(--c-accent)]/30 flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-mono text-[11px] text-[color:var(--c-primary)] font-bold">
            {referralUrl}
          </span>
          <button
            onClick={handleCopy}
            className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
