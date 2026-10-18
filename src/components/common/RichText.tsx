import React from 'react';

/**
 * Plain text with ONE allowed format: **bold**.
 * Built from React nodes only — no innerHTML — so admin-written text can
 * never run markup or scripts.
 */
export const RichText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <React.Fragment key={i}>{p}</React.Fragment>))}
    </>
  );
};
