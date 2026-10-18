# शक्ति से शांति तक — Control Panel aur Website Maintenance ka Poora Guide

> **Ye guide kiske liye hai:** website ke malik/admin ke liye (bina coding ke roz ka kaam) aur us developer ke liye jo website ko update/deploy karta hai.
> **Bhasha:** simple Hindi/Hinglish. **Tareeka:** step-by-step.
> **Website:** `shaktiseshantitak.com` · **Naam:** Shakti Se Shanti Tak

---

## Is guide ko kaise padhein

| Aap kaun hain | Ye parts padhein |
|---|---|
| **Malik / Admin (roz ka kaam)** | Part 1 se Part 8, aur Part 12 (Checklist), Part 13 (Dikkat aaye to) |
| **Developer / Website update karne wala** | Part 9, Part 10, Part 11, aur Part 13 |
| **Pehli baar sab samajhna hai** | Seedha Part 1 se shuru karein |

**Sabse zaroori 10 baatein (pehle ye yaad rakhein)**

1. Control Panel mein jo bhi badlav karein, **"Save" dabaye bina wo live nahi hota.**
2. **Admin ka password kisi ko na dein.** Admin account se poori website badal sakti hai.
3. Kisi bhi **text box ko khaali chhodne** ka matlab hota hai: *website ka purana/asli text dikhega.* Kuch gum nahi hota.
4. Kisi line ko **chhupana** ho to us text box mein sirf **ek space** daal dein (kuch likhe bina).
5. Naya feature aaye jisme **naya SQL migration file** ho, to use Supabase mein chalana zaroori hai (Part 10).
6. **"Master Seed Reset" button kabhi na dabayein** (Part 8 mein bataya hai kyon).
7. **Custom JavaScript** wale box mein sirf wahi code daalein jo aapko 100% bharosemand source se mila ho (Part 5.9).
8. **Rating, reviews, stats** sirf asli data se aate hain — nakli number daalne ki koshish na karein.
9. Koi bhi **bada badlav karne se pehle backup** download karein (Part 8.3).
10. Kuch bhi bigad jaaye to **ghabrayein nahi** — Part 13 mein har dikkat ka ilaaj likha hai.

---

## Part 1 — Website kaise bani hai (sirf zaroori jaankari)

Aapki website 5-6 alag services se milkar chalti hai. Ye jaan lena kaafi hai ki **kaun si cheez kahan hai**:

| Cheez | Kaun si service | Kya kaam karti hai | Kab chhuna padega |
|---|---|---|---|
| **Website ka code** | Netlify | Website ko internet par dikhati hai | Naya version (update) live karte waqt |
| **Database** (books, orders, customers, settings) | Supabase | Saara data yahan rehta hai | Migration chalate waqt, ya login/email settings badalte waqt |
| **Payment** | Razorpay | Online payment leta hai | Keys badalni ho ya live mode on karna ho |
| **Photos/Videos** | Cloudinary / Cloudflare R2 / Supabase Storage | Upload ki hui tasveerein aur files | Storage ke keys badalne par |
| **Domain** (`shaktiseshantitak.com`) | GoDaddy (ya jahan se liya) | Website ka naam/address | Har saal renewal par |
| **Business email** | Zoho Mail / Google Workspace (jo aapne liya ho) | Customer ko jawab dene ke liye email | Mailbox banane/badalne par |
| **Daily backup** | Google Sheet | Roz ka data copy | Mahine mein ek baar check |

**Do hisse yaad rakhein:**
- **Control Panel (Admin)** = wo jagah jahan se aap *text, rang, books, orders, settings* sab badalte hain. Iske liye coding nahi chahiye.
- **Code update** = jab *naya feature* chahiye ho. Ye developer karta hai (Part 9).

---

## Part 2 — Control Panel mein login karna aur Admin ki suraksha

### 2.1 Login kaise karein
1. Browser mein website kholein.
2. Admin login page kholein (aapke developer ne jo admin link/button diya ho, usse).
3. Apna **admin email aur password** daalein.
4. Agar OTP maange to email mein aaya **OTP** daalein (Part 2.3).

### 2.2 Admin kaun ban sakta hai
Sirf wahi account admin hota hai jise database mein `admin` ki role di gayi ho. Naya admin banane ka tareeka (sirf developer kare):

1. Us vyakti ko pehle website par normal **Sign Up** karne dein.
2. Supabase → **Authentication → Users** mein uska **User ID** copy karein.
3. Supabase → **SQL Editor** mein ye chalayein (ID apni jagah daalein):
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<yahan-user-id>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```
4. Admin hatana ho to us user ki `admin` wali row `user_roles` table se delete karein.

> ⚠️ **Zyada admin mat banayein.** Jitne kam log admin honge, utna surakshit.

### 2.3 Admin OTP (MFA) — extra suraksha
- Admin login par ek **extra OTP-verification** ki suraksha hai, jo shuru mein *band (off)* rakhi gayi hoti hai taaki test ke dauran aap lock-out na ho jaayein.
- Jab ek baar admin login + OTP sahi se chal jaaye aur sab theek lage, tab ise **on** karein.
- **On karne ke liye** Supabase → **SQL Editor** mein:
```sql
UPDATE admin_mfa_config SET enforced = true;
```
- OTP email na aaye to `docs/guides/otp-email-setup-and-troubleshooting.md` dekhein.

### 2.4 Roz ki suraksha aadatein
- Password **lamba aur alag** rakhein (kisi aur site ka password na rakhein).
- Admin panel **public computer/cyber cafe** mein na kholein.
- Kaam ho jaane par **Logout** karein.
- Koi **anjaan link / email** se admin login na karein.
- **15 minute** koi kaam na ho to website khud logout kar deti hai — ye suraksha ke liye hai.

---

## Part 3 — Control Panel ka naksha

Control Panel ke **left side** menu mein ye sections hain:

| Group | Section | Kya karta hai |
|---|---|---|
| **Overview** | **Dashboard** | Bikri, orders, stock alert, customers ke sawal (inquiries), newsletter subscribers, Google Sheet backup |
| **Catalog** | **Books** | Pustak jodna, badalna, daam aur stock |
| | **Categories** | Pustakon ki shreniyan |
| **Sales** | **Orders** | Payment, dispatch aur delivery track karna |
| | **Customers** | Grahakon ki list |
| | **Coupons** | Discount code |
| | **Affiliates** | Affiliate partners, referral, withdrawal |
| **Content** | **Blog** | Lekh/news |
| | **Gallery** | Photo gallery |
| | **Reviews & Testimonials** | Pathakon ki samiksha |
| | **Live Stream** | Live satsang |
| **Website** | **Site Settings** | Naam, rang, text, shipping, email, About, FAQ, policy, popup… (sabse bada section) |
| | **SEO** | Google/search ki settings |
| **Security** | **Security** | Audit log, backup download, admin suraksha |

> 💡 **Phone par:** menu ke liye upar ka **menu (☰) button** dabayein ("Open menu").

---

## Part 4 — Roz ka kaam (Dashboard, Orders, Customers)

### 4.1 Dashboard — roz subah ek nazar
Dashboard par aapko milta hai:
- **Bikri aur orders** ka saar.
- **Stock alert** — kaun si pustak kam bachi hai ("Manage Stock →" se seedha jaa sakte hain).
- **Customer inquiries** — jo log Contact form se sawal bhejte hain.
- **Newsletter Subscribers** — footer se jude hue emails (list dekhein, delete karein, CSV download karein).
- **Google Sheet Daily Backup** ki settings.

**Roz karne wale kaam:**
1. Dashboard kholein → naye **orders** dekhein.
2. **Inquiries** padhein aur Part 1 wale business email se jawab dein.
3. **Stock kam** ho to Books section mein stock badhayein ya nayi chhapai ka plan banayein.

### 4.2 Orders — order ko aage badhana (step-by-step)
1. **Orders** section kholein.
2. Jis order par kaam karna hai use kholein ("Orders Fulfillment & Tracking Update" dikhega).
3. Wahan ye jaankari dikhegi: **Order Number, Customer & Address, Courier Partner, Payment & Items.**
4. **Courier** (jaise India Post, Delhivery, DTDC, Blue Dart) aur **Tracking Number** likhein.
5. **Update Order Status** se status chunein:

| Status | Matlab | Kab chunein |
|---|---|---|
| **Awaiting Payment (unpaid)** | Payment abhi nahi aayi | Khud-ba-khud rehta hai; payment aane par badal jaata hai |
| **Processing** | Order mil gaya, taiyari chal rahi hai | Naya order |
| **Shipped** | Courier ko de diya | Parcel bhejne ke baad (tracking number ke saath) |
| **Out for Delivery** | Aaj delivery ke liye nikla | Courier se update milne par |
| **Delivered** | Mil gaya | Delivery confirm hone par |
| **Cancelled** | Order radd | Customer ki request / payment fail |

6. **Documents** mein order ki **receipt / invoice** milti hai — print karke parcel ke saath rakh sakte hain.
7. Customer apna order **Order Tracking** page par dekh sakta hai.

> ✅ **Dhyan dein:** status **sirf aage ki taraf** badhayein (Processing → Shipped → Delivered). Galat status customer ko galat jaankari deta hai.
>
> 🧾 **Invoice par asli GSTIN:** invoice ka company naam, pata aur **GSTIN** aap Site Settings → *Page ke lekh* → "ऑर्डर सफल पेज एवं इनवॉइस" group se bharte hain (Part 5.5). **GSTIN khaali ho to wo line invoice par chhapti hi nahi.** Agar aap GST-registered nahi hain to "इनवॉइस शीर्षक" mein `TAX INVOICE` ki jagah `INVOICE` likhein. Pakka karne ke liye apne CA/accountant se poochh lein.

### 4.3 Customers
- **Customers** section mein grahakon ki list aur unka account status dikhta hai.
- Kisi customer ka **password aap nahi dekh sakte** — ye surakshit hai.

---

## Part 5 — Catalog aur Sales

### 5.1 Pustak (Book) jodna / badalna
1. **Books** → **Add Book** (naya) ya kisi book par **Edit**.
2. Ye jaankari bharein:

| Box | Matlab |
|---|---|
| **Book Title \*** | Pustak ka naam (zaroori) |
| **Original Sanskrit Title (Devanagari)** | Sanskrit naam |
| **Category** | Shreni (pehle Categories mein banani hoti hai) |
| **ISBN Code** | ISBN |
| **MRP Price (₹)** | Chhapa hua daam |
| **Offer Price (₹)** | Asli bikri ka daam |
| **Stock Quantity** | Kitni copy bachi hain |
| **Publisher** | Prakashak |
| **Total Pages** | Prishth sankhya |

3. **Varieties (alag-alag roop)** — jaise Hardcover/Paperback/E-book, alag Language:
   *Variety Name, Binding Format, Language, MRP, Offer Price, Stock, Variety Image.*
4. Photo upload karein (Part 5.8).
5. **Save** karein.
6. Website par pustak ka page kholkar check karein (daam, photo, stock).

> 💰 **Daam kahan-kahan dikhta hai:** Book ke **Offer Price** se hi hero button ("Buy Now @ ₹…"), mobile menu aur Curiosity page ka daam apne-aap aata hai. Isliye daam sirf **ek jagah (Books)** badalna hota hai.

### 5.2 Categories
1. **Categories** → naya banayein: **Category Name \***, **Description**, **Category Banner Image**.
2. Ye shreniyan website ke **Footer** mein aur **Books** page ke filter mein apne-aap dikhti hain.
3. Kisi category ko delete karne se pehle dekh lein ki us mein kitni pustakein hain.

### 5.3 Authors (Lekhak)
- Authors ki jaankari Control Panel mein add/edit/delete hoti hai: **Author Name, Title/Role, Short Bio, Location, Website (optional), Author Photo.**
- Ye **Authors page** par dikhte hain.
- Home page ka "Revered Authors" featured section: **Site Settings → पेज सामग्री** mein.
- ⚠️ **Title, Location, Website save hone ke liye migration `027` chalana zaroori hai** (Part 10).

### 5.4 Coupons (Discount code)
1. **Coupons** → naya coupon.
2. Code, discount (kitna), **Min. Order Value (₹)**, **Expiry Date**, aur **Applies To** (poori site ya kuch chuni pustakon par) set karein.
3. Save karein. Customer cart mein code daalkar discount le sakta hai.
4. Purana ya expire coupon band/delete kar dein.

### 5.5 Affiliates (Partner programme)
- Partner kisi ko refer karte hain; unka **commission** wallet mein jaata hai.
- Control Panel mein aap partners, referrals aur **withdrawal requests** dekhte aur manage karte hain.
- Withdrawal approve karne se pehle partner ki details dhyan se check karein.

### 5.6 Blog
- **Blog** → naya lekh: **Article Title \***, **Short Summary**, **Author Name**, **Category**, phir **Publish**.
- Lekh **Blog page** par dikhta hai.

### 5.7 Gallery
- **Gallery** → **Photo Title \***, **Category**, **Caption**, **Photo** → **Save Photo**.

### 5.8 Photo / Video upload ke niyam
- Photo **bahut badi (MB mein) na ho** — website tez rahe, isliye chhoti/compress karke daalein.
- Upload kaam na kare to Part 13 dekhein.
- Video ke liye **YouTube link** sabse aasan hai.

### 5.9 Reviews & Testimonials (Pathakon ki samiksha)
**Do tarah ki cheezein hain:**
1. **Customer ki likhi samiksha** — Reviews page par customer khud likhta hai. Ye pehle **aapke approval** ke baad hi public hoti hai.
2. **Aapki daali hui samiksha / testimonial** — aap Control Panel se pathak ki samiksha jod sakte hain.

**Samiksha jodne ke steps:**
1. **Reviews & Testimonials** → naya review.
2. **Scripture Title** (kaun si pustak), **Rating Stars**, **Reader / Devotee Name \***, **City / District**, aur comment bharein (photo/video optional).
3. Save karein → ye **Reviews page par turant dikhti hai**.
4. Galat/spam review ko **hide ya delete** kar dein.

> 🔎 **Review website par kyon nahi dikh raha? (seedha check):**
> - Review card par **"✓ Approved"** hona chahiye. **"Hidden"** = website par nahi dikhega.
> - Card par peela **"सिर्फ़ इस ब्राउज़र में"** nishaan = wo review database me gaya hi nahi, sirf aapki screen me hai. Uspar **"Website पर Publish करें"** dabayein. Hara ✅ sandesh aaye tabhi wo live hai; laal ❌ sandesh me asli wajah likhi aati hai.
> - **🔄 Database से दोबारा लोड** dabane par list database ki asli sthiti dikhati hai.
> - Panel ke neeche-baayen **"Version: …"** se pata chalta hai ki kaun sa build live hai. Naya code deploy karne ke baad ye tareekh/samay badalna chahiye — na badle to purana code chal raha hai.
> - Supabase → SQL Editor me asli sthiti dekhne ke liye:
>   ```sql
>   select id, user_name, is_approved, book_id, created_at
>   from public.reviews order by created_at desc;
>   ```
>   `is_approved = true` wale review hi website par dikhte hain.
>
> ⭐ **Rating kaise banti hai:** Reviews page ki rating, "98% verified" jaise numbers aur star bars **sirf approved reviews se apne-aap** calculate hote hain. Koi review nahi to "—" dikhta hai. Home page ka rating-badge bhi isi se aata hai.
>
> 🧹 **Purane sample/demo reviews hata dein**, warna wo rating mein ginte rahenge.

### 5.10 Live Stream
- **Live Stream** → **Live Session Title \***, **Revered Speaker / Acharya \***, **YouTube / Stream URL**, **Session Description**.
- Session chalu/band yahin se hota hai.

---

## Part 6 — Site Settings (sabse zaroori hissa)

**Site Settings** kholne par upar **4 groups** dikhte hain. Har button ek alag section kholta hai.

| Group | Section (button) | Kya badalta hai |
|---|---|---|
| **वेबसाइट की पहचान** | 🌐 नाम एवं ब्रांड | Naam, domain, tagline, ghoshna patti |
| | 📞 संपर्क एवं ईमेल | Phone, emails, WhatsApp, pata |
| | 🖼️ लोगो एवं फ़ेविकॉन | Logo aur browser icon |
| | 🎨 रंग, थीम एवं स्टाइल | Website ke rang, font, custom CSS/JS |
| **स्टोर** | 🚚 शिपिंग एवं भुगतान | Free-delivery limit, shipping charge, COD |
| **सामग्री** | ✍️ पेज के लेख एवं लेबल | Poori website ka text (660+ boxes) |
| | 📄 पेज सामग्री | About, banners, stats, authors, FAQ, legal |
| | 🏠 होमपेज बिल्डर | Hero banner, sections ka kram |
| | 🗂️ कस्टम पेज | Naye extra pages |
| | 📣 ऑफर पॉपअप | Popup offers |
| | 📁 मीडिया लाइब्रेरी | Photos/files |
| **सिस्टम** | 📊 एनालिटिक्स व पिक्सल | Google Analytics, Facebook Pixel |
| | 💾 बैकअप व रीस्टोर | JSON backup aur hero book |

### ⭐ Save karne ka niyam (bahut zaroori)
- **Sabhi sections ke badlav ek hi Save se save hote hain.**
- Ek section mein badlav karke dusre section mein jaa sakte hain; badlav yaad rehte hain.
- Sabse neeche hamesha ek **"बदलाव सुरक्षित करें (Save)"** button dikhta hai — kaam ke baad use dabayein.
- Save ke baad website kholkar (ya refresh karke) check karein.

### 6.1 🌐 नाम एवं ब्रांड
1. **वेबसाइट का नाम (Site Brand Name):** `शक्ति से शांति तक` (ya jo chahein). Header, footer aur SEO mein yahi naam aata hai.
2. **वेबसाइट टैगलाइन (Subtitle):** naam ke neeche ki line. *(Header mein ye tabhi badalti hai jab aap ise purane default se alag likhein.)*
3. **वेबसाइट डोमेन (Website Domain):** `shaktiseshantitak.com` (https:// likhe bina). Header chip, mobile patti, footer aur banner mein yahi dikhta hai.
4. **घोषणा पट्टी (Announcement Bar Text):** upar ki chalti hui offer line.
5. **Save.**

### 6.2 📞 संपर्क एवं ईमेल
| Box | Kahan dikhta hai |
|---|---|
| **हेल्पलाइन फ़ोन** | Top bar, Contact page, Footer |
| **सपोर्ट ईमेल** | Contact page, Footer, Google ke liye data |
| **ऑर्डर / बिलिंग ईमेल** (optional) | Contact page par (khaali = nahi dikhega) |
| **गोपनीयता / कानूनी ईमेल** (optional) | Contact page par (khaali = nahi dikhega) |
| **व्हाट्सएप नंबर** | WhatsApp button |
| **पता (Office Address)** | Contact page, invoice, Google data |

**Suraksha / niyam:**
- Galat email likhne par **Save nahi hota** (laal warning aati hai) — sahi karke dobara Save karein.
- Email apne aap chhote akshar (lowercase) mein save hota hai.
- Policy (kanooni) text mein `{supportEmail}`, `{ordersEmail}`, `{privacyEmail}` likhne par ye pate apne aap judte hain.
- ⚠️ **Sirf wahi email likhein jo asli mein chalta ho** aur jis par aap jawab de sakein. Default `support@shaktiseshantitak.com` hai — isko apne asli mailbox se **zaroor badlein/confirm karein.**

> 📧 **Ek zaroori baat:** Customer ko jo **system emails** jaate hain (Signup confirmation, Password reset, Admin login OTP) wo **Supabase** bhejta hai, is Control Panel se nahi. Unka sender aur text badalne ke liye **Supabase → Authentication → Email Templates** (aur SMTP settings) mein jaayein. Dekhein: `docs/guides/otp-email-setup-and-troubleshooting.md`.

### 6.3 🖼️ लोगो एवं फ़ेविकॉन
1. **Site Logo** upload karein (saaf, chhota, PNG/WebP behtar).
2. **Favicon** (browser tab ka chhota icon) upload karein (square).
3. Save → website refresh karke dekhein. Purana favicon dikhe to browser cache saaf karein.

### 6.4 🎨 रंग, थीम एवं स्टाइल  (Website ke rang)
**Ye wahi jagah hai jahan se header, footer, background aur baaki rang badalte hain.**

**Step-by-step:**
1. **Site Settings → 🎨 रंग, थीम एवं स्टाइल** kholein.
2. **Sabse aasan tareeka:** upar ke **taiyaar color schemes** mein se ek chunein: *मैरून-सुनहरा (मूल)*, *केसरिया मंदिर*, *शांत हरा*, *रात्रि नीला*.
3. **Live preview** mein header, card, button aur footer ka nazara turant dikhta hai.
4. Khud rang chunne ke liye har rang ke saamne **colour box** par click karein ya `#RRGGBB` likhein (jaise `#6B1D3A`).
5. **Readability check** dekhein:
   - Hara ✔ = sab theek padha ja sakta hai.
   - Peela ⚠ = kahin akshar padhna mushkil ho sakta hai — wo rang badal dein.
6. Neeche **Save** dabayein.

**Mukhya 10 rang kahan lagte hain:**

| Rang | Kahan dikhta hai |
|---|---|
| **मुख्य रंग (Primary)** | Header, footer, shirshak |
| **गहरा / सबसे गहरा मुख्य रंग** | Upar ki patli patti, hover, gehre hisse |
| **सुनहरा/उभार रंग (Accent)** | Button, border, icon, sitare (iska poora gold-shade set apne aap banta hai) |
| **हल्का उभार रंग** | Gehre hisson par likhe shabd/link |
| **पेज की पृष्ठभूमि** | Poori site ka peeche ka rang |
| **कार्ड की पृष्ठभूमि** | Card, box, form |
| **मुख्य लेख / हल्का लेख** | Paragraph / upshirshak |
| **Ink (गहरा लेख)** | Sunehre button par akshar |

**Header/Footer ke alag rang (optional):**
`हेडर की पृष्ठभूमि`, `हेडर के अक्षर`, `हेडर की पतली पट्टियाँ`, `फुटर की पृष्ठभूमि`, `फुटर के अक्षर`.
Khaali chhodne par ye mukhya rangon ka paalan karte hain.

**Wapas purane rang par jaana:**
- Kisi ek rang ke saamne **"मूल"** dabayein, ya
- **"सब मूल रंग"** se sab reset karein, phir Save.

**Dhyan dein:**
- Ye rang **Admin panel par lagu nahi hote** (jaan-boojhkar) — taaki koi galat rang chunne par bhi aap Admin padh sakein.
- Mobile browser ka upar ka rang header ke saath badalta hai.
- Naya rang save karne ke baad pehli baar kuch second purana rang dikh sakta hai, phir wo yaad ho jaata hai.

**Font, kone aur custom code (isi section ke neeche):**
- **Font Family**, **Border Radius** (card ke kone kitne gol).
- **Custom CSS** — design ka chhota sa badlav (sirf jaankar).
- **Custom JavaScript** — ⚠️ **bahut sambhal ke.** Ye code website ke har visitor ke browser mein chalta hai. **Kisi anjaan ya online mile code ko yahan kabhi paste na karein** — ye website hack ka sabse seedha raasta hai. Sirf wahi code daalein jo aapke bharosemand developer ne diya ho.

### 6.5 🚚 शिपिंग एवं भुगतान
- **मुफ्त डिलीवरी न्यूनतम राशि (Free Shipping Threshold):** itne ya zyada ke order par delivery muft.
- **डिलीवरी शुल्क (Shipping Charge):** is limit se kam ke order par kitna lagega. **0 daalne par delivery hamesha muft** rehti hai. Cart, checkout aur payment — teeno jagah yahi charge lagta hai.
- Neeche 4 on/off (tick) boxes hain:
  - **लाइव सत्संग (Live Stream) वेबसाइट पर दिखाएं**
  - **कैश ऑन डिलीवरी (COD) चालू रखें**
  - **BHIM / UPI भुगतान चालू रखें**
  - **Card / NetBanking (Razorpay) चालू रखें**
  Tick hatane par wo tareeka checkout se hat jaata hai. (Kam se kam ek payment tareeka chalu rakhein, warna customer order nahi de payega.)
- ✅ **Ye rakam FAQ aur Policy page mein apne-aap dikhti hai** (jahan `{freeShipping}` likha ho), isliye sirf yahin badalni hoti hai.
- **GST dar** cart, checkout aur invoice mein asli dar ke saath dikhti hai.

### 6.6 ✍️ पेज के लेख एवं लेबल  (Poori website ka text)
**Ye section poori website ka lagbhag har dikhne wala text badalne deta hai.**

**Step-by-step:**
1. **Site Settings → ✍️ पेज के लेख एवं लेबल.**
2. Upar **Page Text Manager** hai. **Khoj (search) box** mein koi shabd likhein — jaise `Cart`, `शिपिंग`, `Wishlist`, `Footer`.
3. Jo text badalna hai uska box kholein. Box ke andar **ग्रे (halka) text = website ka abhi ka text.**
4. Apna naya text likhein.
5. Neeche **Save**.

**Niyam:**
| Aap kya karte hain | Kya hota hai |
|---|---|
| Naya text likhein | Wahi text website par dikhta hai |
| **Box khaali chhodein** | Website ka **purana/asli text** dikhta hai (kuch gum nahi hota) |
| Sirf **ek space** daalein | Wo line **chhup jaati hai** |
| **"मूल लेख"** button | Us ek box ko wapas purane text par le jaata hai |

**Ye bhi jaanein:**
- Sirf **saada text** chalta hai (HTML/code nahi) — surakshit hai.
- Lambi limit (lagbhag 600 akshar, lambe paragraph ke liye zyada) hoti hai.
- Kuch boxes mein `{rate}`, `{price}`, `{mrp}`, `{title}` jaise **token** hote hain. Inhe **jas ka tas** rehne dein — website unki jagah asli GST dar / daam / naam daal deti hai.
- Boxes group mein hain: Home, Contact, Footer, Cart, Checkout, Order Success + Invoice, Wishlist, Books, Blog, FAQ, Tracking, Dashboard, Book Details, Gayatri/Curiosity, aur "अन्य: कंपोनेंट…" (Navbar, Footer, BookCard, Quick View, Affiliate Portal, Live-stream waghera).

**Lambe kaardon wale pages (articles, sawal-jawab):**
Isi section mein **"लंबे लेख वाले पेज"** panel hai:
- **गायत्री रहस्य पेज: लेख** (maximum 12)
- **जिज्ञासा पेज: सवाल-जवाब कार्ड** (maximum 6)
- **जिज्ञासा पेज: तीन गहरे बिंदु** (maximum 6)

Har card ko aap **badal, naya jod, upar-neeche kar, ya hata** sakte hain.
- Mote akshar ke liye shabd ko `**aise**` likhein.
- **Saare card hata dene par wo hissa page se chhup jaata hai.**
- **"मूल सामग्री लौटाएँ"** se purani poori list wapas aa jaati hai.

**Kya jaan-boojhkar is box se nahi badalta:**
- Login / Signup page ka text.
- Error ya validation messages ("password match nahi" jaise) aur "15 minute inactivity" wala suraksha-sandesh.
- Payment gateway (Razorpay) ki apni window ka text.
- Admin panel ka apna text.

### 6.7 📄 पेज सामग्री
Is section mein ye sab hain:
- **🪔 About Page** — hamare baare mein ka text, photo, credit.
- **🏳️ पेज बैनर** — Gallery / Curiosity / Gayatri Secrets pages ke heading aur subtitle (aur Gayatri video ka YouTube link).
- **होम पेज के 4 आंकड़े (Sacred Stats Band)** — niche dekhein.
- **🙏 Revered Authors (Featured Section)** — home ka lekhak section.
- **❓ FAQ प्रश्न-उत्तर प्रबंधन** — sawal-jawab jodna/badalna/hatana.
- **📜 कानूनी पृष्ठ** — Privacy / Terms / Shipping / Return policy ka poora text.

**Home ke 4 aankde (Stats Band) ke niyam:**
- Granthon ki sankhya aur rating **asli data se** aati hai.
- "Readers" aur "Countries" jaise aankde ka koi asli source nahi hota — wo **tabhi dikhte hain jab aap sachcha aankda khud likhein.**
- Kuch dikhane layak na ho to poori patti chhup jaati hai.
- ⚠️ **Yahan sirf sach likhein** (jaise "500+ pathak" tabhi jab sach ho).

**Legal pages likhne ka tareeka:**
- Har hissa **khaali line** se alag karein. Jis hisse ko **heading** banana ho uski shuruat `## ` se karein (jaise `## 1. Hamari Niti`) — baaki hissa seedha paragraph banta hai.
- `{freeShipping}`, `{supportEmail}`, `{ordersEmail}`, `{privacyEmail}` ko jas ka tas rakhein.
- Kanooni text ek baar apne vakeel/CA se zaroor dikhwa lein.

### 6.8 🏠 होमपेज बिल्डर
- **Hero Banner Editor:** Main title, tagline, subtitle, top badge. *"रेटिंग बैज" khaali chhodein to asli rating apne aap dikhegi.*
- **Section Content:** About section ka heading/subtitle, Buy CTA headline/subtitle.
- **Section Visibility & Order:** home ke kaun se hisse dikhein aur kis kram mein.
- **Extra Footer Columns:** footer mein apne extra links ke column.

### 6.9 🗂️ कस्टम पेज
- Naya extra page banayein (jaise "Temple Distribution", "Awards").
- Do cheezein bharein: **पृष्ठ का शीर्षक (Title)** aur **पृष्ठ की सामग्री (Content)** → Save.
- Page ka address apne aap banta hai. List mein **"URL Slug: /page-…"** dikhta hai aur ek **View** button hai. Website par uska link `shaktiseshantitak.com/pages/<slug>` hota hai.
- Is page ka link logon tak pahunchane ke liye **होमपेज बिल्डर → Extra Footer Columns** ya popup ke **button URL** mein ye address daalein.

### 6.10 📣 ऑफर पॉपअप
- Popup ke liye: **टैग/टाइटल, मुख्य हेडलाइन, विवरण, तस्वीर URL, बटन का text, बटन par click kahan le jaaye.**
- Popup zyada na rakhein — visitor ko pareshaan karte hain.

### 6.11 📁 मीडिया लाइब्रेरी
- Yahan se photo/file upload karke unka **link** copy karke kahin bhi (jaise popup, banner) use kar sakte hain.

### 6.12 📊 एनालिटिक्स व पिक्सल
- **Google Analytics ID** (jaise `G-XXXXXXX`) aur **Facebook/Meta Pixel ID** daalein.
- Sirf ID daalein, poora code nahi.

### 6.13 💾 बैकअप व रीस्टोर
- **JSON backup** download/restore, aur **Featured Hero Book** (home ke hero mein kaun si pustak).
- Bada badlav karne se pehle **backup** zaroor download karein.

---

## Part 7 — SEO aur Newsletter

### 7.1 SEO
- **SEO** section mein Google ke liye title/description jaisi settings hain.
- Website ka **sitemap** `shaktiseshantitak.com/sitemap.xml` par hona chahiye.
- Live hone ke baad **Google Search Console** (search.google.com/search-console) mein domain add karke sitemap submit karein.

### 7.2 Newsletter Subscribers
- Footer ke "Join" form se email **sach me save** hoti hai (migration `028` ke baad).
- Dekhne ke liye: **Dashboard → Newsletter Subscribers.**
  - **Refresh**, **delete** (kisi ko hatana ho to), aur **CSV** download.
- Kisi subscriber ke kehne par use **delete** kar dein.
- Surakshit: visitor table ko seedha nahi chhu sakta; duplicate email par bhi wahi "success" dikhta hai (koi pata nahi laga sakta kaun subscribed hai).
- Footer mein jo **privacy line** dikhti hai wo Page Text Manager mein badal sakte hain.

---

## Part 8 — Security section aur Backup

### 8.1 Security section mein kya hai
- **Audit log** — Admin ne kya-kya kiya uska record.
- **Download JSON Backup** — poore data ki copy.
- **Clear Audit View** — sirf aapki screen ka log saaf karta hai (asli record nahi).
- **Master Seed Reset** — ⚠️ neeche padhein.

### 8.2 ⛔ "Master Seed Reset" — kabhi na dabayein
Ye button website ke **dikhne wale data ko demo/sample data se badal deta hai** aur browser ka saved data saaf karta hai. Uske baad agar aap Site Settings mein **Save** dabate hain, to **aapki asli settings demo wali settings se badal sakti hain.**
- Ye sirf developer ke **local test** ke liye hai.
- Live website par galti se dab jaaye to **turant Save na karein**; page refresh karein aur developer ko batayein / backup se restore karein.

### 8.3 Backup — kab aur kaise
| Kab | Kya karein |
|---|---|
| **Har bade badlav se pehle** | Security → **Download JSON Backup** (ya Site Settings → 💾 बैकअप) |
| **Roz (apne aap)** | Google Sheet mein daily backup chalta hai (Dashboard → Google Sheets Daily Backup) |
| **Mahine mein ek baar** | Google Sheet khol ke dekhein ki naya data aa raha hai (kabhi Google ki permission expire ho sakti hai) |

Backup file kisi **surakshit jagah** (apne Google Drive ya pen-drive) mein rakhein — kisi ko share na karein, usme customer ka data hota hai.

---

## Part 9 — Website ko update (naya version) live karna  *(Developer ka kaam)*

### 9.1 Update ka sahi tareeka (har baar)
1. **Backup lein** (Part 8.3).
2. Naya code zip **extract** karein.
3. Terminal mein folder ke andar:
```bash
npm install          # naye packages (agar zaroorat ho)
npm run lint         # TypeScript check — koi error nahi aana chahiye
npm run test:all     # saare safety tests — sab PASS aana chahiye
npm run build        # production build — "built in ..." aana chahiye
```
4. Agar naye **SQL migration** files hain to pehle **Part 10** karein.
5. Code ko **Netlify** par deploy karein:
   - **Git se (behtar):** code ko apne Git repo mein push karein; Netlify khud build karke live kar deta hai.
   - **Manual:** Netlify CLI se `netlify deploy --prod` (detail: `docs/security/security-and-deployment-guide.md` ka Part 4).
6. Deploy hone ke baad **website hard-refresh** karke check karein (Part 12 ka "Update ke baad check").

> 🔁 **Env variable badalne ke baad** Netlify mein **"Trigger deploy"** zaroor karein — sirf variable badalne se site khud redeploy nahi hoti.

### 9.2 Kuch bhi gadbad ho to wapas jaana (rollback)
- Netlify → **Deploys** → pichhla **kaam karne wala deploy** chunein → **"Publish deploy"**. Site turant purane version par aa jaati hai.
- Database ke liye backup se restore karein.

### 9.3 Zaroori environment variables (`.env.example` mein poori list)
| Variable | Kya hai | Kahan se |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project ka link | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Public key (frontend ke liye) | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Gupt (secret)** key — server ke liye | Supabase → API |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Payment keys | Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Payment confirmation ki suraksha | Razorpay Webhook settings |
| `R2_*` (optional) | Cloudflare file storage | Cloudflare |
| `VITE_CLOUDINARY_CLOUD_NAME` (+ preset) | Photo upload | Cloudinary |

> 🔐 **`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` ko kabhi kisi ko na dein, chat/email/WhatsApp mein na bhejein, aur code ya zip mein na likhein.** Ye sirf Netlify ke environment variables mein rahein.
> Key leak ho jaaye to turant **nayi key banakar purani delete (rotate)** karein, phir Netlify mein update karke redeploy karein.

---

## Part 10 — Database migrations (Supabase SQL)

### 10.1 Migration kya hai
Har `supabase/migrations/NNN_naam.sql` file database mein ek **naya table / niyam / suraksha** jodti hai. Inhe **numbering ke order mein** (001 se 028) chalana hota hai.

### 10.2 Chalane ka tareeka (step-by-step)
1. Supabase dashboard → **SQL Editor** → **New query**.
2. Migration file ko text editor mein kholkar **poora text copy** karein.
3. SQL Editor mein **paste** karke **Run** dabayein.
4. **"Success"** dikhe to agli file par jaayein.
5. **"already exists"** jaisa error aaye to aam taur par theek hai (matlab pehle chal chuki hai) — aage badhein. Koi aur error aaye to **ruk jaayein** aur error note karein.
6. **Kabhi order na badlein, koi file skip na karein.**

### 10.3 Abhi kaun si zaroor chalani hain
| File | Kyon zaroori |
|---|---|
| **025** `self_service_insert_hardening` | Review/insert ki suraksha — koi customer khud ko "approved/verified" nahi bana sakta |
| **027** `authors_extra_columns` | Authors ka Title / Location / Website save ho sake |
| **028** `newsletter_subscribers` | Footer newsletter ke emails sach me save hon |

(Jin files par aap pehle hi chala chuke hain unhe dobara chalana safe hai.)

### 10.4 Saari migrations ek nazar mein
`001` initial schema · `002` security fixes · `003` RLS hardening · `004` storage buckets · `005` affiliate wallet integrity · `006` category image · `007` blogs · `008` contact messages · `009` coupon validation · `010` real affiliate system · `011` duplicate registration roak · `012` persistent rate limiting · `013` real categories · `014` coupon product scope · `015` stock restore · `016` book trailer video · `017` manual customer contacts · `018` gallery · `019` customer review columns · `020` category image fix · `021` atomic order state machine · `022` affiliate security · `023` FAQ/testimonial/video/event tables · `024` admin MFA aur audit log · `025` self-service insert hardening · `026` book detail columns · `027` authors extra columns · `028` newsletter subscribers.

---

## Part 11 — Naya text / rang / feature kaise jodein *(Developer ke liye)*

| Kaam | Kahan karein |
|---|---|
| **Naya text editable banana** | `src/utils/siteContent.ts` mein ek line jodein, page mein `c('naya.key')` use karein |
| **Naya Control Panel box (saved setting)** | `types/index.ts` mein type + `AdminPage.tsx` mein: state, **resync `useEffect` line**, aur **save payload line** (teeno zaroori — warna save ke baad data purana wapas aa sakta hai) |
| **Naya Settings section** | `src/components/admin/settings/settingsNav.ts` mein jodein aur `AdminPage.tsx` mein `{settingsSubTab === 'id' && (...)}` block banayein |
| **Naya rang** | Raw hex kabhi nahi — `bg-[color:var(--c-primary)]` jaisa variable use karein (`src/utils/themeColors.ts`, `src/index.css`) |
| **Lambe card wale content** | `src/utils/contentLists.ts` |

Zyada detail: `docs/internal/PAGE_TEXT_SYSTEM.md`.

**Tests chalana:**
```bash
npm run test:all           # sab ek saath
npm run test:content       # page text system
npm run test:lists         # lambe card list + bold text safe
npm run test:newsletter    # newsletter safety
npm run test:render        # pages purane text ke saath hi dikhte hain
npm run test:settings-nav  # Control Panel ke sections/emails
npm run test:theme         # rang system (suraksha + padhne layak)
npm run test:theme-editor  # rang editor
npm run test:payment       # payment suraksha
npm run test:admin-layout  # admin layout
```
**Rule:** `npm run test:all` aur `npm run build` dono **pass** hone par hi code live karein.

---

## Part 12 — Checklists (kab kya karna hai)

### Roz (5 minute)
- [ ] Dashboard dekhein — naye orders, stock alert, inquiries
- [ ] Naye orders ko **Processing → Shipped** karein, tracking number daalein
- [ ] Inquiries ka jawab dein
- [ ] Naye customer reviews ko approve/hide karein

### Hafte mein ek baar
- [ ] Coupons — expire hue hataayein
- [ ] Reviews/spam check
- [ ] Newsletter subscribers dekhein (agar mail bhejte hain to CSV download)
- [ ] Website khol kar phone par ek baar sab pages ghoom lein

### Mahine mein ek baar
- [ ] **Google Sheet backup** mein naya data aa raha hai?
- [ ] Ek **JSON backup** apne Drive mein rakhein
- [ ] Razorpay dashboard mein payments/settlement milayein
- [ ] Admin password badlein (har 2-3 mahine)
- [ ] Domain aur hosting ki **renewal date** dekhein (domain expire = poori site band)

### Naya update live karne ke baad (Update ke baad check)
- [ ] Home, Books, ek Book page, Cart, Checkout khulte hain
- [ ] Header/footer ka text aur **rang** theek hai (phone par bhi)
- [ ] Ek **test order** (chhoti raashi) Razorpay se — order "Paid" dikhta hai
- [ ] Order Tracking page chalta hai
- [ ] Admin login chalta hai, order status update hota hai
- [ ] Photo upload chalta hai
- [ ] Footer se newsletter test email jaata hai aur Dashboard mein dikhta hai
- [ ] Reviews page par rating/aankde asli dikhte hain

### Live hone se pehle (ek baar)
- [ ] `https://` aur lock icon
- [ ] Signup OTP email turant aata hai (apne domain se)
- [ ] Forgot Password link chalta hai
- [ ] Razorpay **Test mode** mein sab theek → tabhi **Live mode**
- [ ] Admin MFA on (Part 2.3)
- [ ] Sitemap Google Search Console mein submit

---

## Part 13 — Dikkat aaye to (Troubleshooting)

| Dikkat | Kaaran | Ilaaj |
|---|---|---|
| **Badlav website par nahi dikh raha** | Save nahi dabaya / browser purana page dikha raha hai | Neeche ka **Save** dabayein, phir page **hard-refresh** (phone: browser band karke khole / "Reload"). Phir bhi na ho to Settings dubara khol ke dekhein ki badlav save hua? |
| **Save dabate hi "email sahi nahi" laal sandesh** | Email galat likha hai | Sampark section mein email sahi karein (jaise `naam@domain.com`) |
| **Text box mein likha par page par purana text dikh raha hai** | Space/khaali / save nahi hua | Dobara Save karein; box mein kuch alag character ya galat jagah to nahi? |
| **Koi line chhupani thi par dikh rahi hai** | Space nahi, kuch aur likha | Box mein **sirf ek space** daalein, Save |
| **Rang bigad gaye / akshar padhe nahi ja rahe** | Rang ki choice | 🎨 section mein **"सब मूल रंग"** → Save. Ya taiyaar scheme chunein. Admin panel kabhi nahi bigadta |
| **Page abhi bhi purane rang mein dikhta hai** | Browser cache | Hard refresh; private/incognito window mein kholkar dekhein |
| **Control Panel mein review dikh raha hai par website par nahi** | Review sirf aapke browser me hai (database me nahi gaya) ya "Hidden" hai | Card par **"Website पर Publish करें"** dabayein (ya "Hidden" par click). ✅ aaye tabhi live hai. Phir bhi na ho to laal ❌ sandesh padhein, aur dekhein ki panel ke neeche "Version" naya hai (naya code deploy hua?) |
| **Rating "—" dikh rahi hai** | Abhi koi approved review nahi | Normal hai. Review jodein/approve karein |
| **Authors ka Title/Location save nahi hota** | Migration `027` baaki | Part 10 se `027` chalayein |
| **Newsletter "सदस्यता उपलब्ध नहीं"** | Migration `028` baaki | `028` chalayein |
| **Order status update nahi ho raha** | Admin session expire / network | Logout-login karein, dobara koshish |
| **Payment ho gaya par order "Awaiting Payment"** | Razorpay webhook ya key ki dikkat | Razorpay dashboard mein payment dekhein; webhook secret Netlify mein sahi hai? Redeploy karein |
| **OTP / Reset email nahi aa raha** | SMTP settings | `docs/guides/otp-email-setup-and-troubleshooting.md` |
| **Photo upload nahi hota** | Cloudinary/R2/Storage keys ya file bahut badi | Chhoti photo try karein; keys check karein (`docs/guides/cloudinary-setup.md`) |
| **Panel kehta hai "saved/published" par website par nahi dikh raha** | Purana code chal raha ho (naya deploy nahi hua) | Panel ke **Version** ki tareekh dekhein; naya build deploy karein (Part 9). Naye code me panel jhootha "published" nahi bolta — sirf asli result dikhata hai |
| **Admin se lock-out ho gaye** | MFA on hai aur OTP nahi aa raha | Developer Supabase se OTP/SMTP dekhe; zaroorat par `UPDATE admin_mfa_config SET enforced = false;` chalakar wapas login, fir dikkat theek karke dobara `true` |
| **Pura Settings ya data demo jaisa ban gaya** | "Master Seed Reset" ya galat Save | **Save mat dabayein**; JSON backup se restore karein; developer ko batayein |
| **Site hi nahi khul rahi** | Domain expire / Netlify deploy fail | Domain renewal dekhein; Netlify → Deploys mein pichhla kaam karne wala deploy **Publish** karein |
| **Build / test fail (developer)** | Code mein error | `npm run lint`, `npm run test:all` ka error padhein; pehle theek karein, tabhi deploy |

---

## Part 14 — Suraksha ke Do aur Don't

### ✅ Karein
- Hamesha **HTTPS** wali site par kaam karein.
- Admin ka **lamba, alag password** rakhein aur **MFA on** rakhein.
- Har bade badlav se pehle **backup** lein.
- Naya code live karne se pehle `npm run test:all` aur `npm run build` chalayein.
- Secret keys ko sirf **Netlify environment variables** mein rakhein.
- Customer ki jaankari (address, phone, email) ko **suraksha se** rakhein; backup/CSV kisi ko share na karein.
- Sirf **asli** rating, review, aankde, GSTIN aur address likhein.
- Kisi ke kehne par uska newsletter email / data **hata dein**.

### ❌ Na karein
- Admin password ya `service_role` / Razorpay secret kisi ko na dein.
- **Master Seed Reset** na dabayein.
- **Custom JavaScript** mein anjaan code paste na karein.
- Migration ka order na badlein, koi migration skip na karein.
- Nakli GSTIN, nakli reviews, nakli aankde na daalein.
- Admin account public computer par khula na chhodein.
- Bina test ke seedha live payment mode na chalayein.
- Code zip ko public jagah (WhatsApp group, open Drive link) par na bhejein — usme technical jaankari hoti hai.

---

## Part 15 — Chhoti Shabdavali (Glossary)

| Shabd | Matlab |
|---|---|
| **Control Panel / Admin** | Malik ka niyantran panel |
| **Deploy** | Naya code website par live karna |
| **Migration** | Database mein badlav ki SQL file |
| **Supabase** | Database + login system |
| **Netlify** | Website ko internet par chalane wali service |
| **Razorpay** | Online payment gateway |
| **RLS** | Database ki suraksha — kaun kya dekh/badal sakta hai |
| **MFA / OTP** | Login par ek aur suraksha-code |
| **Cache** | Browser ka purana yaad kiya hua page |
| **Hard refresh** | Cache hatakar naya page dobara laana |
| **Env variable** | Gupt keys/settings jo Netlify mein rakhi jaati hain |
| **Webhook** | Razorpay ka server ko "payment ho gaya" bataana |
| **Token (`{rate}`, `{price}`)** | Text ke andar ki jagah jo website asli value se bharti hai |
| **Rollback** | Pichhle kaam karne wale version par wapas jaana |

---

## Zaroori files (project ke andar)

| File | Kis liye |
|---|---|
| `README.md` | Project ka parichay aur commands |
| `docs/guides/zero-to-live-deployment.md` | Shuru se live tak poora setup (domain, email, Supabase, Netlify, Razorpay, backup) |
| `docs/guides/otp-email-setup-and-troubleshooting.md` | OTP / reset email ki dikkat |
| `docs/guides/cloudinary-setup.md` | Photo upload setup |
| `docs/guides/production-deployment.md` | Production release checklist |
| `docs/security/security-and-deployment-guide.md` | Suraksha aur deployment |
| `docs/internal/PAGE_TEXT_SYSTEM.md` | Text/rang/settings system (developer) |
| `.env.example` | Zaroori environment variables ki list |
| `supabase/migrations/` | Database migration files (001 → 028) |

---

*Ye guide `shaktiseshantitak.com` ke Control Panel ke maujooda version ke hisaab se hai. Agar aage naya section/feature jude, to is guide mein usi tarah ek line jod dein.*
