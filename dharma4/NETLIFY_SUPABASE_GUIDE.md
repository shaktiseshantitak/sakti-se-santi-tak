# ⚠️ महत्वपूर्ण सूचना: Full-Stack Node.js Server आवश्यकता (Important Architecture Notice)

> **IMPORTANT NOTICE:** 
> इस प्रोजेक्ट में **Full-Stack Express.js Node Server (`server.ts`)** का उपयोग किया गया है जो **Payment Gateway Verification (Razorpay / UPI), Order Creation, Webhooks, Rate Limiting, और Secure Order Tracking APIs** को संचालित करता है।
> 
> **इसलिए Netlify पर 'Static Drag & Drop (`dist` folder)' तैनाती इस प्रोजेक्ट के लिए समर्थित नहीं है (NOT Supported for Full Production).**
> यदि आप केवल `dist` फोल्डर को ड्रॉप करेंगे, तो पेमेंट वेरिफिकेशन, आर्डर ट्रैकिंग एपीआई, और सिक्योरिटी फीचर्स काम नहीं करेंगे।

---

## 🚀 अनुशंसित उत्पादन परिनियोजन (Recommended Full-Stack Deployment)

पूरे एप्लिकेशन (Node.js Server + Frontend + Supabase DB) को लाइव करने के लिए कृपया **`PRODUCTION_DEPLOYMENT.md`** गाइड का पालन करें।

### संक्षेप में सही होस्टिंग विकल्प:

1. **Render.com / Railway.app / Cloud Run / Render Web Service**
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start` (node dist/server.cjs)
   - **Environment Variables:**
     - `PORT=3000`
     - `NODE_ENV=production`
     - `SUPABASE_URL` / `VITE_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY` / `VITE_SUPABASE_ANON_KEY`
     - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`

2. **VPS (Ubuntu / DigitalOcean / AWS EC2)**
   - Node.js v18+ इंस्टाल करें।
   - PM2 से प्रक्रिया चलाएं: `pm2 start dist/server.cjs --name dharma-books`

---

## 🗄️ Supabase डेटाबेस सेटअप (Database Setup Instructions)

1. **Supabase में नया प्रोजेक्ट बनाएं:** [supabase.com](https://supabase.com) पर जाएं और न्यू प्रोजेक्ट बनाएं।
2. **SQL Schema निष्पादित करें:** 
   - प्रोजेक्ट के मुख्य डायरेक्टरी में स्थित **`supabase_schema.sql`** तथा **`migrations/002_security_fixes.sql`** को कॉपी करें।
   - Supabase डैशबोर्ड -> **SQL Editor** में पेस्ट करके **Run** करें।
3. **Environment Variables सेट करें:**
   - `VITE_SUPABASE_URL` = आपका Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = आपका anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = आपका service role secret key (केवल सर्वर-साइड उपयोग हेतु)

---

> विस्तृत और पूर्ण गाइड के लिए **`PRODUCTION_DEPLOYMENT.md`** देखें।

