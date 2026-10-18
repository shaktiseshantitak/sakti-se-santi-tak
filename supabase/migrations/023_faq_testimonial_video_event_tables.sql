-- ====================================================================
-- MIGRATION 023: FAQ / TESTIMONIAL / VIDEO / EVENT TABLES
-- ====================================================================
-- Source: FINAL_BUG_SECURITY_AUDIT.md BUG-020, 021, 022, 023 — verified:
-- none of these four tables existed in the schema at all. FAQs,
-- testimonials, and videos were add/update/delete-able in local React
-- state only (BookContext.tsx), so any admin change vanished on refresh
-- and every real visitor only ever saw the hardcoded INITIAL_FAQS/
-- INITIAL_TESTIMONIALS/INITIAL_VIDEOS seed arrays from
-- src/data/initialData.ts — exactly the same class of bug migration 018
-- fixed for `gallery`. Events had no CRUD functions at all, read-only
-- from INITIAL_EVENTS.
--
-- Same pattern as migration 018 (gallery): public-read/admin-write
-- table, seeded with the exact current hardcoded content so nothing
-- visually changes on the live site the moment this migration runs.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write faqs" ON public.faqs;
CREATE POLICY "Admin write faqs" ON public.faqs FOR ALL USING (public.is_admin());

INSERT INTO public.faqs (id, question, answer, category) VALUES
    ('faq-1', 'Are all scripture editions authentic and verified by traditional scholars?', 'Yes! Every text, verse translation, and commentary published by Shakti Se Shanti Tak undergoes rigorous peer review by traditional Sanskrit pundits, Acharyas, and Vedantic scholars to guarantee textual purity and fidelity.', 'Authenticity & Publishing'),
    ('faq-2', 'How are physical books packaged for transit?', 'We treat sacred books with utmost reverence. All hardbound volumes are wrapped in protective moisture-proof sealers, cushioned with eco-friendly bubble padding, and packed in heavy corrugated boxes marked "Handle with Respect".', 'Shipping & Delivery'),
    ('faq-3', 'Do you ship internationally outside India?', 'Yes! We ship physical books across the USA, UK, Canada, Australia, UAE, Europe, and over 80 countries via courier partners (DHL, FedEx, India Post EMS). E-books (PDFs) are available instantly worldwide.', 'Shipping & Delivery'),
    ('faq-4', 'How can I access my purchased E-Books (PDFs)?', 'Immediately after checkout, your E-Books appear in your Customer Dashboard under "My E-Library". You can read them directly in our interactive browser reader or download high-resolution PDF files.', 'E-Books & Digital'),
    ('faq-5', 'What payment methods are supported on Shakti Se Shanti Tak?', 'We support all major Indian & international payment gateways: UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking across 50+ banks, Wallets, and Cash on Delivery (COD within India).', 'Payments & Orders')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    location TEXT,
    avatar TEXT,
    comment TEXT NOT NULL,
    rating INT DEFAULT 5,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write testimonials" ON public.testimonials;
CREATE POLICY "Admin write testimonials" ON public.testimonials FOR ALL USING (public.is_admin());

INSERT INTO public.testimonials (id, name, role, location, avatar, comment, rating, verified, created_at) VALUES
    ('test-shakti-1', 'आचार्य देवेंद्र शास्त्री', 'वैदिक साधक एवं मंत्र विश्लेषक', 'वाराणसी', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'इस ग्रंथ को पढ़ने के बाद मंत्रजाप को देखने का मेरा दृष्टिकोण ही बदल गया है। कुंजेश शर्मा और पूनम शर्मा जी ने गायत्री एवं दुर्गा मंत्र के जिन आभ्यंतर रहस्यों को उजागर किया है, वह अद्भुत और जीवन परिवर्तक है।', 5, TRUE, NOW() - INTERVAL '4 days'),
    ('test-1', 'Dr. Ananya Sharma', 'Sanskrit Professor', 'New Delhi', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'The paper quality, typography, and precise Devanagari font rendering in the Srimad Bhagavad Gita edition are exceptional. Truly a collector edition every home must treasure.', 5, TRUE, NOW() - INTERVAL '3 days'),
    ('test-2', 'Rajesh K. Verma', 'Devotee & Businessman', 'Mumbai', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'Ordered the complete Ramcharitmanas for my parents. The packaging was immaculate, and the delivery via Blue Dart arrived within 48 hours in pristine condition.', 5, TRUE, NOW() - INTERVAL '2 days'),
    ('test-3', 'Meera Deshmukh', 'Yoga Instructor', 'Pune', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', 'The pocket Hanuman Chalisa with QR audio sync is my daily companion during travel. Sound quality of the chanted mantras is divine!', 5, TRUE, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    youtube_id TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    speaker TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read videos" ON public.videos;
CREATE POLICY "Public read videos" ON public.videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write videos" ON public.videos;
CREATE POLICY "Admin write videos" ON public.videos FOR ALL USING (public.is_admin());

INSERT INTO public.videos (id, title, youtube_id, description, duration, speaker, category) VALUES
    ('vid-1', 'Unboxing Sri Ramcharitmanas Deluxe Gold Embossed Edition', 'gA7Z_1R2O2k', 'Detailed walkthrough of the paper quality, typography, gold gilding, and Awadhi translation notes.', '14:20', 'Acharya Devendra Shastri', 'Book Unboxing'),
    ('vid-2', 'Key Verses of Bhagavad Gita for Modern Stress Management', '2Vv-BfVoq4g', 'Discourse on applying Gita Chapter 2 & 6 teachings to achieve calm decision-making.', '28:45', 'Swami Vidyananda', 'Discourse'),
    ('vid-3', 'How Sacred Vedic Printing & Book Binding is Preserved', 'YQHsXMglC9A', 'Behind the scenes at Shakti Se Shanti Tak publishing house in Varanasi.', '09:15', 'Master Printer Ramesh Chand', 'Documentary')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_date TEXT,
    event_time TEXT,
    location TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    description TEXT,
    registration_url TEXT,
    speaker TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write events" ON public.events;
CREATE POLICY "Admin write events" ON public.events FOR ALL USING (public.is_admin());

INSERT INTO public.events (id, title, event_date, event_time, location, is_online, description, speaker, image) VALUES
    ('evt-1', 'Gita Jayanti World Scripture Discourse & Book Release', 'December 11, 2024', '10:00 AM - 05:00 PM IST', 'Varanasi International Convention Center & Online Zoom Stream', TRUE, 'Join eminent Vedantic acharyas for a day of chanting all 700 slokas and launching the 2025 Multi-lingual Gita series.', 'Mahamandaleshwar Swami Shankarananda', NULL),
    ('evt-2', 'Vedic Chanting & Stotra Recitation Workshop', 'January 15, 2025', '04:00 PM - 07:00 PM IST', 'Bengaluru Spiritual Heritage Center', FALSE, 'Learn authentic Sanskrit pronunciation and svara accents for Suktas and Stotrams directly from Vedic Pundits.', 'Pt. Venkatesh Shastri', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;
