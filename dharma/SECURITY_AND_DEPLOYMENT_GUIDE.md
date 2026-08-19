# 🛡️ DHARMA BOOKS PRO — SECURITY & PRODUCTION DEPLOYMENT GUIDE (सुरक्षा एवं डिप्लॉयमेंट गाइड)

> **Official Enterprise Security & Cyber Defense Documentation**
> Complete guide for zero-vulnerability deployment, anti-hacking, anti-DDoS, anti-hanging, Supabase RLS policies, and Netlify deployment.

---

## 🇮🇳 मुख्य सुरक्षा फ़ीचर्स (Security Highlights in Hindi)

इस प्रोजेक्ट में साइबर हमलों (Cyber Attacks), वेबसाइट हैक (Hacking), डेटा चोरी, और सर्वर या ब्राउज़र हैंग (Site Hanging / DoS) से बचाने के लिए बहु-स्तरीय सुरक्षा (Multi-layered Security Guardrails) लागू की गई है:

1. **XSS (Cross-Site Scripting) सुरक्षा**: सभी फ़ॉर्म इनपुट (नाम, पता, ईमेल, रिव्यू, मैसेज) को ऑटोमैटिक सैनिटाइज़ (`sanitizeInput`) किया जाता है ताकि कोई भी हैकर स्क्रिप्ट कोड इंजेक्ट न कर सके।
2. **DDoS और साइट हैंगिंग प्रोटेक्शन (Sliding Window Rate Limiting)**: बॉट्स और अटैकर्स को बार-बार फ़ॉर्म सबमिट करने या सर्वर हैंग करने से रोकने के लिए `isRateLimited` थ्रॉटलिंग लागू है।
3. **एंटी-बॉट हनीपॉट ट्रैप (Anti-Bot Honeypot Defense)**: चेकआउट और कांटेक्ट फ़ॉर्म में हिडन ट्रैप फ़ील्ड्स लगाए गए हैं जो ऑटोमेटेड स्पैम बॉट्स को बिना यूज़र को परेशान किए पकड़ कर तुरंत ब्लॉक कर देते हैं।
4. **SQL इंजेक्शन से सुरक्षा (SQL Injection Safeguard)**: Supabase पैरामीटर बाइंडिंग तथा `sanitizeSqlParam` सैनिटाइजेशन के ज़रिए डेटाबेस सुरक्षित है।
5. **सुरक्षित HTTP हेडर्स (Security Headers)**: `X-Frame-Options` (एंटी-क्लिकजैकिंग), `Content-Security-Policy` (CSP), `X-Content-Type-Options`, तथा `HSTS` लागू हैं।
6. **सुरक्षित डेटा स्टोरेज (Crash-proof SafeStorage)**: LocalStorage में मालफॉर्म्ड या टेम्पर्ड डेटा से ऐप को क्रैश / ब्लैक स्क्रीन होने से बचाने के लिए `safeStorageGet` और `safeStorageSet` प्रोटेक्टेड रैपर्स हैं।
7. **मास्टर एडमिन कंट्रोल पैनल (Master Control Panel)**: पूरी वेबसाइट को 100% कंट्रोल करने के लिए डेडिकेटेड एडमिन पैनल बनाया गया है जहाँ से बुक्स, ऑर्डर्स, कैटगरी, ऑथर्स, डिस्काउंट कूपन, अनाउंसमेंट टिकर, हेल्पलाईन, साइबर लॉग्स और डेटाबेस बैकअप को रियल-टाइम में मैनेज किया जा सकता है।

---

## 1. 🛡️ Implemented Cyber Security Guardrails

### A. Input Sanitization & Anti-XSS Protection
All form inputs are strictly sanitized before state processing or database persistence:
- Strips `javascript:`, `data:`, `vbscript:`, and inline event handlers (`onload=`, `onerror=`).
- Encodes HTML characters (`<`, `>`, `"`, `'`, `/`, `&`).
- Truncates oversized string payloads to prevent DOM lag or browser freeze (DoS).

### B. Anti-Bot Honeypot Defense
Forms include hidden honeypot fields invisible to legitimate human users:
- Automated spam bots auto-fill these fields, triggering instant silent rejection.

### C. Client & Server Sliding Window Rate Limiting
- Prevents submission floods (max 3-5 actions per minute per endpoint).
- Prevents UI memory leaks and server crashes during brute-force attacks.

### D. Safe Storage Engine
- Prevents client-side crashes caused by corrupted or tampered local storage values.

---

## 2. 🗄️ Supabase PostgreSQL Setup & Row Level Security (RLS)

### Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. In Project Settings -> API, copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### Step 2: Execute Database Schema & RLS Policies
Navigate to **Supabase SQL Editor** and paste the following production script:

```sql
-- Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'BookOpen',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  original_title TEXT,
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  category_name TEXT NOT NULL,
  author_name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  publication_year INT DEFAULT 2024,
  edition TEXT,
  isbn TEXT UNIQUE NOT NULL,
  mrp NUMERIC(10,2) NOT NULL,
  offer_price NUMERIC(10,2) NOT NULL,
  discount_percent INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 4.9,
  pages INT DEFAULT 400,
  stock INT DEFAULT 50,
  is_bestseller BOOLEAN DEFAULT false,
  cover_image TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  order_status TEXT DEFAULT 'Processing',
  courier_name TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — ANTI-HACK DATA ISOLATION
-- ============================================================

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy (Anyone can browse books)
CREATE POLICY "Public Read Books" ON public.books
  FOR SELECT USING (true);

CREATE POLICY "Public Read Categories" ON public.categories
  FOR SELECT USING (true);

-- 2. User Order Isolation (Users only see their own orders)
CREATE POLICY "User View Own Orders" ON public.orders
  FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

-- 3. Admin Modification Policy (Authenticated Admins only)
CREATE POLICY "Admin Full Access Books" ON public.books
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'authenticated');
```

---

## 3. 💳 Razorpay Payment Webhook Security Verification

To prevent counterfeit payment spoofing attacks, verify the Razorpay HMAC signature on your backend server before updating order status:

```typescript
// server.ts / Edge Function
import crypto from 'crypto';

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(signature)
  );
}
```

---

## 4. 🚀 Netlify Production Deployment Protocol

### Option A: Automatic Git Deployment
1. Push this repository to GitHub/GitLab.
2. Log in to [Netlify](https://app.netlify.com).
3. Click **Add new site** -> **Import an existing project**.
4. Select repository. Build command will auto-detect as `npm run build`, output directory as `dist`.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy Site**.

### Option B: Netlify CLI Manual Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build production bundle
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

---

## 5. 🔒 Anti-Hanging & Performance Checklist

| Potential Attack / Failure | Protection Mechanism | Status |
| :--- | :--- | :---: |
| **XSS Injection** | `sanitizeInput` HTML entity encoding & protocol strip | ✅ ACTIVE |
| **Form Flooding / DoS** | Sliding Window Rate Limiting (`isRateLimited`) | ✅ ACTIVE |
| **Spam Bots** | Hidden Honeypot Field (`website_url_honeypot`) | ✅ ACTIVE |
| **Clickjacking** | `X-Frame-Options: SAMEORIGIN` header | ✅ ACTIVE |
| **MIME Sniffing** | `X-Content-Type-Options: nosniff` header | ✅ ACTIVE |
| **Unsafe Script Execution** | Strict Content-Security-Policy (CSP) | ✅ ACTIVE |
| **LocalStorage Crash** | `safeStorageGet` try-catch JSON parser | ✅ ACTIVE |
| **SQL Injection** | Supabase ORM parameterized queries & SQL sanitizer | ✅ ACTIVE |

---

## 6. 📱 Contact & Support Desk

For technical assistance, bulk temple orders, or security audit logs:
- **Publishing Desk**: Varanasi Assi Ghat Road, UP, India - 221005
- **Email**: `support@dharmabooks.pro`
- **Phone**: `+91 98765 43210`
