import React from 'react';
import { PageHeaderBanner } from '../components/common/PageHeaderBanner';
import { GayatriSecretsSection } from '../components/home/GayatriSecretsSection';
import { useBooks } from '../context/BookContext';
import { useCart } from '../context/CartContext';
import { Book } from '../types';

interface GayatriSecretsPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const GayatriSecretsPage: React.FC<GayatriSecretsPageProps> = ({ onNavigate }) => {
  const { books } = useBooks();
  const { addToCart } = useCart();
  const shaktiBook = books.find(b => b.id === 'book-shakti') || books[0];

  const handleBuyNow = (bookToBuy?: Book) => {
    const targetBook = bookToBuy || shaktiBook;
    addToCart(targetBook, 'Hardcover', targetBook.languages[0] || 'Hindi', 1);
    onNavigate('checkout', { directBook: targetBook });
  };

  return (
    <div className="min-h-screen bg-[#F8F4E8] text-[#4A2C17]">
      <PageHeaderBanner
        title="गायत्री महामंत्र का रहस्य एवं 24 देवशक्तियाँ (आध्यात्मिक लेख)"
        subtitle="वेदों की ऋचाओं से लेकर आधुनिक विज्ञान तक—गायत्री एवं दुर्गा मंत्र की अंतयात्रा का अभूतपूर्व रहस्यमयी ज्ञान।"
        onNavigate={onNavigate}
        onBuyNow={() => handleBuyNow(shaktiBook)}
      />

      <div className="py-6">
        <GayatriSecretsSection
          shaktiBook={shaktiBook}
          onBuyNow={handleBuyNow}
        />
      </div>
    </div>
  );
};
