import React from 'react';
import { PageHeaderBanner } from '../components/common/PageHeaderBanner';
import { CuriosityQuestionsSection } from '../components/home/CuriosityQuestionsSection';
import { useBooks } from '../context/BookContext';
import { useCart } from '../context/CartContext';
import { Book } from '../types';

interface CuriosityPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CuriosityPage: React.FC<CuriosityPageProps> = ({ onNavigate }) => {
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
        title="जिज्ञासा पैदा करने वाले सवाल एवं वैज्ञानिक गहराई"
        subtitle="क्या आपने कभी सोचा है कि वर्षों तक मंत्र जाप के बाद भी मन को शांति क्यों नहीं मिलती? जानिए Alpha Waves एवं अभेद्य सुरक्षा कवच का रहस्य।"
        onNavigate={onNavigate}
        onBuyNow={() => handleBuyNow(shaktiBook)}
      />

      <div className="py-6">
        <CuriosityQuestionsSection
          shaktiBook={shaktiBook}
          onBuyNow={handleBuyNow}
        />
      </div>
    </div>
  );
};
