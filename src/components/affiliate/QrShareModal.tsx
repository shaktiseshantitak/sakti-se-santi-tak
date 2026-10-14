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
      <div className="bg-[#FFFCF7] border border-[#B8923A]/50 w-full max-w-sm rounded-3xl p-6 shadow-sm space-y-4 relative text-center text-[#33231B]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6B1D3A] hover:bg-amber-100 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#6B1D3A]/10 text-[#6B1D3A] flex items-center justify-center mx-auto border border-[#6B1D3A]/20">
          <QrCode className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-serif font-bold text-lg text-[#6B1D3A]">
            आपका विशिष्ट QR व रेफ़रल कोड
          </h3>
          <p className="text-xs text-[#6B5748]">
            Scan to register or purchase using code <strong className="text-[#6B1D3A]">{referralCode}</strong>
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#B8923A]/30 inline-block shadow-xs">
          <img
            src={qrCodeImg}
            alt="Referral QR Code"
            className="w-48 h-48 object-contain mx-auto rounded-lg"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#B8923A]/30 flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-mono text-[11px] text-[#6B1D3A] font-bold">
            {referralUrl}
          </span>
          <button
            onClick={handleCopy}
            className="bg-[#B8923A] hover:bg-amber-400 text-[#2B1B14] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
