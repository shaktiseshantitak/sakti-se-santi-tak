-- ====================================================================
-- MIGRATION 013: SEED REAL CATEGORIES (ROOT CAUSE — "ADD BOOK" SILENT FAILURE)
-- ====================================================================
--
-- BUG FOUND (2026-08-28 report — "New book add/update/delete UI-based
-- hai, real nahi"):
-- books.category_id has a FOREIGN KEY to categories(id). The frontend's
-- category dropdown falls back to a hardcoded local list (INITIAL_CATEGORIES
-- in src/data/initialData.ts, ids 'cat-1'..'cat-10') any time the real
-- `categories` table is empty — which it always was, since no migration
-- had ever actually put rows into it. So every "Add Book" in the admin
-- panel referenced a category_id like 'cat-3' that didn't exist as a real
-- row → the INSERT silently violated the foreign key → the book only ever
-- existed in the admin's own local browser state (see also the
-- lastSyncError fix in BookContext.tsx, which at least makes failures
-- like this visible going forward instead of silent).
--
-- FIX: seed real rows with the SAME ids the frontend already uses as its
-- fallback, so a book referencing any of them succeeds. ON CONFLICT DO
-- NOTHING makes this safe to re-run and safe if an admin already manually
-- created some of these categories with different content.
-- ====================================================================

INSERT INTO public.categories (id, name_hi, name_en, slug, description, icon_name, image_url, sort_order) VALUES
('cat-1', 'भगवद गीता', 'Bhagavad Gita', 'bhagavad-gita', 'Sacred translations, commentaries, and multi-lingual editions of the divine song.', 'BookOpen', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80', 1),
('cat-2', 'रामायण', 'Ramayana', 'ramayana', 'Valmiki Ramayana, Ramcharitmanas, and inspiring retellings of Lord Rama.', 'Shield', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 2),
('cat-3', 'महाभारत', 'Mahabharata', 'mahabharata', 'The great epic of righteousness, duty, and spiritual wisdom.', 'Scroll', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80', 3),
('cat-4', 'वेद', 'Vedas', 'vedas', 'Rigveda, Yajurveda, Samaveda, and Atharvaveda with original mantras and translations.', 'Flame', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80', 4),
('cat-5', 'उपनिषद', 'Upanishads', 'upanishads', 'Philosophical treatises detailing Self-realization, Brahman, and Atman.', 'Sparkles', 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80', 5),
('cat-6', 'पुराण', 'Puranas', 'puranas', 'Srimad Bhagavatam, Shiva Purana, Vishnu Purana, and Mahapuranas.', 'Bookmark', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', 6),
('cat-7', 'स्तोत्र एवं चालीसा', 'Stotra & Chalisa', 'stotra-chalisa', 'Hanuman Chalisa, Vishnu Sahasranama, Lalita Sahasranama, and Shiva Stotram.', 'Sun', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', 7),
('cat-8', 'मंत्र एवं पूजा', 'Mantra & Puja', 'mantra-puja', 'Pooja vidhi manuals, Vedic chants, yajna procedures, and daily prayers.', 'Heart', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80', 8),
('cat-9', 'योग एवं ध्यान', 'Yoga & Meditation', 'yoga-meditation', 'Patanjali Yoga Sutras, Kundalini, Pranayama, and dhyana practical guides.', 'Compass', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80', 9),
('cat-10', 'बाल आध्यात्मिक पुस्तकें', 'Children Spiritual Books', 'children-spiritual', 'Illustrated moral stories, Panchatantra, Jataka tales, and young reader scriptures.', 'Smile', 'https://images.unsplash.com/photo-1512253022256-de3cbaf7cc0c?auto=format&fit=crop&w=600&q=80', 10)
ON CONFLICT (id) DO NOTHING;
