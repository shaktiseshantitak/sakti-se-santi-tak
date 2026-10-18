# OTP Email "Error 500" — Pehle Asli Error Dekhein, Phir Zero Se Setup

## SABSE PEHLE: Asli error dekhna (2 minute mein pata chal jaayega)

"Error 500" sirf ek generic message hai — Supabase iske peeche ka ASLI reason
apne **Logs** mein chhupa ke rakhta hai. Bina ye dekhe guess karna time waste
hai. Abhi ye karein:

1. Supabase dashboard → left sidebar → **Logs → Auth Logs** (kahin-kahin
   sirf "Logs" ke andar ek dropdown mein "Auth" milta hai).
2. Jab error aaye, 1-2 minute ke andar yahan ek naya red/error row dikhega —
   usse click karke poora **"error"** field padhein.

Zyada tar in 4 mein se ek message milega — neeche apna wala dhoondein:

### "Email address is not verified" ya "identities failed the check"
**Matlab:** Resend ko jo email bheja ja raha hai (jaise OTP lene wale
customer ka email) use Resend "From" address samajh raha hai, aapke set
kiye hue sender ki jagah. Ye ek known Supabase bug hai jab SMTP settings
abhi-abhi badli ho.
**Fix:** Authentication → Emails → SMTP Settings mein jaake **Sender email**
field ko ek baar khaali karke dubara type karein (same value) aur **Save**
dubara dabayein — settings "refresh" ho jaati hain. Phir dubara test karein.

### "domain is not verified" ya koi DKIM/SPF wala message
**Matlab:** Resend pe domain "Verified" dikh raha hai, lekin asal mein woh
sirf domain-ownership record (TXT) verify hua hai — DKIM record abhi bhi
pending hai (ye alag record hai). Resend dashboard mein verified hone ke
baad bhi DKIM record DNS mein poora propagate hone mein time lagta hai.
**Fix:** Resend.com → Domains → apna domain click karein → neeche har
record (SPF, DKIM) ke saamne hara ✅ "Verified" likha hona chahiye, sirf
ऊपर domain ka naam hara nahi. Agar DKIM wala record abhi bhi "Pending"
hai, GoDaddy DNS mein jaake check karein ki record **exactly** wahi hai jo
Resend ne diya tha (ek bahut common galti: `resend._domainkey` ki jagah
galti se `resend_domainkey` — beech mein period `.` chhoot jaata hai).
Fix karke Resend mein "Verify DNS Records" dubara click karein.

### "Connection refused" ya "dial tcp" ya timeout
**Matlab:** Host/Port galat hai ya "Secure connection" (SSL) setting port
se match nahi kar rahi.
**Fix:** Neeche di gayi exact values use karein (section "Fresh Setup").

### "Invalid login" ya "authentication failed" ya "535"
**Matlab:** Resend API key galat/purani copy hui hai, ya SMTP mein Username
field mein kuch aur likh diya gaya (Resend mein Username hamesha literally
`resend` hota hai, apna email nahi).
**Fix:** Neeche "Fresh Setup" section follow karein, naya API key banayein.

Agar Logs mein error bilkul kuch aur hi likha ho jo upar match na ho, uska
exact text yahan paste kar dein, main usi hisaab se batata hoon.

---

## Zero se Fresh Setup (agar upar se fix na ho, ya pakka sahi karna ho)

### Step 1 — Resend mein saaf-suthra verify

1. **resend.com → Domains** → apna domain (`shaktiseshanti.com`) click
   karein.
2. Yahan 2-3 rows dikhengi — **SPF**, **DKIM** (kabhi-kabhi "DMARC" bhi) —
   **har ek ke aage** hara "Verified" dikhe, sirf top banner pe nahi.
3. Agar koi "Pending"/"Failed" hai, uski "Value" ko **dobara copy** karein
   (purani copy mein typo ho sakta hai) aur GoDaddy DNS mein us record ko
   check karein — Type aur Name dono match hone chahiye character-by-character.
4. Sab hara hone ke baad hi aage badhein.

### Step 2 — Naya SMTP API Key banayein (purana delete karke)

1. Resend → **API Keys** → agar purani koi key hai jo SMTP ke liye use kar
   rahe the, use "..." → Delete karein (clean start ke liye).
2. "Create API Key" → naam dein (`supabase-smtp`) → Permission: **Sending
   access** → Domain: apna hi domain select karein (agar option mile) →
   Create.
3. Jo key milegi (`re_...` se shuru hoti hai) use **turant copy kar lein** —
   ye sirf ek baar dikhti hai, dubara nahi.

### Step 3 — Supabase SMTP Settings (exact values)

Supabase dashboard → **Authentication → Emails → SMTP Settings** (naam
"Emails" ki jagah seedha "SMTP Settings" bhi ho sakta hai):

| Field | Value |
|---|---|
| Enable Custom SMTP | ON |
| Sender email | `otp@shaktiseshanti.com` (ya jo bhi aapne Resend mein domain ke neeche banaya — **important: ye address usi domain ka hona chahiye jo Resend mein verified hai**) |
| Sender name | `Shakti Se Shanti Tak` |
| Host | `smtp.resend.com` |
| Port number | `465` |
| Username | `resend` (yehi literally likhna hai, apna email nahi) |
| Password | Step 2 wali API key (`re_...`) |

⚠️ **Port 465 ke saath "Secure Connection"/SSL ka toggle ON hona chahiye**
(agar dashboard mein separate toggle ho). Agar kisi wajah se 465 kaam na
kare, **Port 587** try karein us case mein SSL toggle OFF / "STARTTLS" rakhein
— dono combinations try kar sakti hain, Resend dono support karta hai.

4. **Save** karein.
5. Save hote hi ek "Send test email" jaisa option milta hai (ya "Resend
   test email" button Users list ke paas) — usi se pehle test karein, apne
   actual app ki OTP screen se pehle nahi.

### Step 4 — Rate limit setting bhi check kar lein

Authentication → **Rate Limits** (ya "Attack Protection" ke andar) mein
"Email" ka rate limit dekh lein — custom SMTP lagne ke baad bhi agar ye
bahut kam (jaise 1-2 per hour) set hai to badha dein (jaise 30-60 per hour),
warna testing ke time hi khud block ho jaayengi.

### Step 5 — Asli test

1. Apne website pe ja ke apne hi personal email se naya signup/OTP try
   karein.
2. Agar abhi bhi fail ho, **turant wapis Logs → Auth Logs** dekhein (upar
   wala step 1) — is baar jo bhi naya error aaye wahi final clue hai.

---

## Netlify ka purana subdomain hatana

Netlify har site ko hamesha ek free `kuch-naam.netlify.app` address deta
hai — **ise poori tarah "delete" karna possible nahi hai** (Netlify ka
built-in fallback address hai, site ke saath hi bandha hota hai), lekin
aap isko **chhupa/useless** bana sakti hain taaki koi usse use na kare aur
Google bhi use index na kare:

### A) Us subdomain ka naam badal dein (taaki purana link kaam na kare)
Netlify dashboard → apni site → **Site configuration → General → Site
details** → "Change site name" (ya Domain management mein us
`xxx.netlify.app` ke aage "Options" → "Edit site name") → koi bhi random
naam rakh dein. Isse purana `xxx.netlify.app` link turant kaam karna band
kar dega (404 dega) — sirf aapka naya custom domain hi chalega.

### B) Google isse index na kare — ye apne aap ho jaata hai
Jab bhi site pe custom domain (Part 6 wali guide) set hoti hai, Netlify
khud-ba-khud har request ke saath ek "canonical" signal bhej deta hai jo
Google ko batata hai "asli address ye custom domain hai, subdomain nahi" —
iske liye alag se kuch karne ki zaroorat nahi.

**Summary:** Option (A) hi kaafi hai — site ka naam badal dein, purana
subdomain link apne aap kaam karna band kar dega, aur sirf aapka asli
domain (`shaktiseshanti.com`) chalega.
