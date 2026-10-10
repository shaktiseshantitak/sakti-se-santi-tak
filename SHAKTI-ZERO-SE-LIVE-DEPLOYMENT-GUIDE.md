# शक्ति से शांति तक — Zero se Live: Poori Deployment Guide

**Kisके liye:** Ye guide maan ke chal rahi hai ki abhi tak KUCH bhi setup nahi hua —
na email, na Supabase project, na Netlify, na Razorpay live keys. Website ka
CODE ready hai (zip file jo aapko di gayi hai), bas usse live karne ke liye
har bahar ki service (email, database, hosting, payment, backup) step-by-step
banani hai.

**Kaise padhein:** Upar se neeche, order mein, ek-ek Part karke. Har Part ke
end mein ek chhota checklist hai — usse tick kar ke hi agle Part pe jaayein.
Kisi bhi step pe agar UI ka button/menu naam thoda idhar-udhar mile (companies
apna dashboard design badalte rehte hain), toh yahan diya hua concept (jaise
"MX record", "SMTP settings") dhoondein — wahi cheez hai, naam thoda alag ho
sakta hai.

---

## Zaroorat ki cheezein (ek nazar mein)

| # | Cheez | Kyun chahiye | Cost |
|---|---|---|---|
| 1 | Domain (GoDaddy) | Website ka address, e.g. shaktiseshanti.com | Aapke paas already hai |
| 2 | Business email (Zoho Mail ya Google Workspace) | `contact@shaktiseshanti.com` jaisa email — customers isi pe reply karenge | Zoho free / Google ₹150-500 per mailbox/month |
| 3 | Transactional email service (Resend ya Brevo ya Zoho ka SMTP) | OTP, password-reset, order-confirmation emails **automatically** bhejne ke liye | Zyada tar free tier kaafi hai shuru mein |
| 4 | Supabase account | Database, login/signup, file storage | Free tier se shuru ho sakta hai |
| 5 | Netlify account | Website ko internet pe host karna | Free tier se shuru ho sakta hai |
| 6 | Razorpay account (KYC hua hua) | Payment lena (UPI/Card/etc) | Aapke paas already hai |
| 7 | Cloudflare R2 (optional) | Product photos/videos store karna (bina iske bhi chalega, Supabase Storage use hoga) | Free tier bada hai |
| 8 | Google account (Gmail) | Daily backup Google Sheet mein | Free |

Ye 8 cheezein ek baar set ho jaayein, uske baad website hamesha ke liye live
rahegi — roz kuch karne ki zaroorat nahi.

---

## Part 1 — Domain (GoDaddy)

Aapke paas GoDaddy pe domain (jaise `shaktiseshanti.com`) already hai. Isko
kahin bhi "point" karne ke liye GoDaddy ke DNS records edit karne padte hain —
aage har Part mein jab bhi "DNS mein record daalein" likha ho, matlab hai:

**GoDaddy.com → Sign In → My Products → apne domain ke saamne "DNS" button
→ "Add" se naya record.**

Har record ke 3 cheezein hoti hain: **Type** (A / CNAME / TXT / MX), **Name/Host**
(kaunsa subdomain, jaise `@` matlab root domain ya `www` ya kuch aur), aur
**Value/Points to** (kahan bhejna hai). Aage har service ka apna record
bataya gaya hai — jaise hi milta jaaye, GoDaddy mein add karte jaayein. Ek
saath 5-6 records daalna normal hai, koi problem nahi.

⚠️ **DNS record daalne ke baad live hone mein 10 minute se 48 ghante tak lag
sakte hain** (kabhi-kabhi turant ho jaata hai). Isliye jaldi test na karein,
thoda wait karein.

---

## Part 2 — Business email banana (`contact@shaktiseshanti.com`)

Ye woh email hai jisse customers aapko contact karenge, aur jisse aap unhe
reply karenge — jaise Gmail, bas apne naam ke domain pe.

**Do options hain — koi ek chunein:**

### Option A — Zoho Mail (FREE, 5 users tak) — recommended shuru ke liye

1. **zoho.com/mail** pe jaayein → "Sign Up Now" → "Free Plan".
2. Apna domain daalein (`shaktiseshanti.com`) → "Add".
3. Zoho aapko ek **TXT record** dega, domain "verify" karne ke liye —
   isse copy karke GoDaddy DNS mein daalein (Type: TXT, Name: `@`, Value:
   jo Zoho ne diya). Zoho dashboard mein wapis jaake "Verify" click karein
   (thoda time lag sakta hai).
4. Verify hone ke baad Zoho **MX records** dega (usually 3 records,
   `mx.zoho.in` jaisi values) — inhe bhi GoDaddy DNS mein daalein. ⚠️ Agar
   GoDaddy ka apna default "Email Forwarding" ya koi purana MX record pehle
   se hai, use pehle delete karein — do jagah MX record hone se email aana
   band ho jaata hai.
5. Zoho mein "Create User" → `contact@shaktiseshanti.com` (ya `hello@`,
   `support@`, jo bhi naam chahein) banayein, password set karein.
6. **mail.zoho.in** pe jaake us email/password se login karein — ye aapka
   webmail hai (Gmail jaisa dikhta hai). Phone pe Zoho Mail app se bhi use
   kar sakte hain.

### Option B — Google Workspace (PAID, ~₹150-500/mailbox/month)

1. **workspace.google.com** → "Get Started" → apna business naam aur domain
   daalein.
2. Google ek **TXT record** dega domain verify karne ke liye — GoDaddy DNS
   mein daalein, Google dashboard mein "Verify" karein.
3. Google **MX records** dega (5 records, `ASPMX.L.GOOGLE.COM` jaisi values,
   alag-alag "priority" number ke saath) — sab GoDaddy DNS mein daalein
   exactly jaisa diya ho, priority number sameet.
4. Google Admin Console mein user (`contact@shaktiseshanti.com`) banayein,
   billing set karein.
5. **mail.google.com** pe us email se login — normal Gmail interface hi
   milega, bas apne domain ke saath.

**Kis din yeh kaam ho jaaye:** MX record verify hote hi email aana-jaana
shuru ho jaata hai. Test ke liye khud ko us naye email pe ek mail bhejein
apne personal Gmail se, aur reply karke check karein.

---

## Part 3 — Supabase project banana (database + login system)

Supabase hi database hai jahan aapke saare orders, books, users, sab store
hote hain.

1. **supabase.com** → Sign Up → "New Project".
2. Organization banayein (agar pehli baar hai), phir project ka naam
   (`shakti-se-shanti-tak`), ek strong **database password** banayein aur
   **kahin safe jagah save kar lein** (ye baad mein kabhi dikhta nahi,
   sirf ek baar milta hai) — region "Mumbai (ap-south-1)" chunein agar
   available ho, India ke customers ke liye fastest rahega.
3. Project banne mein 1-2 minute lagte hain.
4. Project ke andar, left sidebar mein **Project Settings (gear icon) →
   API** pe jaayein. Yahan 3 cheezein milengi, sab copy karke kahin (jaise
   ek notepad file mein) save kar lein — ye aage kaam aayengi:
   - **Project URL** → ye `VITE_SUPABASE_URL` hai
   - **anon / public key** → ye `VITE_SUPABASE_ANON_KEY` hai
   - **service_role key** (⚠️ isse kabhi bhi website ke frontend code mein
     ya kisi ko share na karein — ye poore database ka master key hai,
     sirf server-side env variable mein jaata hai) → ye
     `SUPABASE_SERVICE_ROLE_KEY` hai

### Database tables banana (migrations run karna)

Website ke code ke zip mein ek `migrations` folder hai, jisme `001_` se
`024_` tak files hain — har file database mein table/rule banati hai, aur
inhe **sahi order mein (001 pehle, phir 002, ... aakhir mein 024)** chalana
zaroori hai.

1. Supabase dashboard mein left sidebar → **SQL Editor** → "New query".
2. `migrations/001_initial_schema.sql` file ko kisi text editor mein
   (Notepad, VS Code) khol ke poora content copy karein.
3. SQL Editor mein paste karein → "Run" (ya Ctrl+Enter).
4. "Success" dikhne ke baad, agli file `002_...sql` ke saath yahi repeat
   karein — aise hi 003, 004, ... 024 tak, **koi bhi file skip na karein
   aur order kabhi na badlein**.

⚠️ Agar kisi file pe error aaye, ruk jaayein aur error message note kar
lein — aage ki files na chalayein jab tak wo error samajh na liya jaaye
(zyada tar ek migration doosri baar chalane se aata hai — agar already
chal chuki hai to "already exists" jaisa error normal hai, aage badh
sakte hain).

### Login/Signup ke liye URL settings (zaroori — bina iske OTP/reset link kaam nahi karega)

1. Supabase dashboard → **Authentication → URL Configuration**.
2. **Site URL**: `https://shaktiseshanti.com` (apna final live domain
   daalein — jab tak domain live na ho, temporarily Netlify wala URL
   daal sakte hain, baad mein update kar lena).
3. **Redirect URLs** mein add karein: `https://shaktiseshanti.com/*` (aur
   agar `www.` wala bhi use karna hai to `https://www.shaktiseshanti.com/*`
   bhi add karein).

---

## Part 4 — OTP aur Password-Reset email ka setup (Custom SMTP)

Ye woh part hai jo Radha ne specifically poocha — **"OTP password reset ke
liye mail kaise set karni hai"**.

**Samajhna zaroori:** Supabase khud-ba-khud ek default email service deta
hai (koi setup nahi chahiye), lekin uski **badi problems** hain: (1) sirf
**~2-4 email per hour** bhej sakta hai — real customers ke saath ye turant
khatam ho jaayega aur log signup/OTP/password-reset nahi kar paayenge, (2)
email `noreply@mail.app.supabase.io` se aata hai, aapke domain se nahi —
customers ko spam jaisa lagta hai. Isliye **live website ke liye Custom SMTP
zaroori hai**, optional nahi.

### Custom SMTP provider chunein

| Provider | Free limit | Kyun |
|---|---|---|
| **Resend** (resend.com) | 3,000 email/month free | Sabse aasaan setup, developer-friendly |
| **Brevo** (brevo.com, pehle Sendinblue) | 300 email/day free | Bada free tier, Hindi support acha |
| **Zoho ZeptoMail** | Bahut sasta (~₹0.3/email) | Agar Part 2 mein Zoho pehle se use kar rahe hain to sab ek jagah |

Yahan **Resend** ka example diya gaya hai (sabse simple hai), doosre providers
ka process bhi bilkul same pattern follow karta hai:

1. **resend.com** pe sign up karein.
2. **Domains → Add Domain** → `shaktiseshanti.com` daalein.
3. Resend aapko 2-3 **DNS records** dega — ek **SPF** (Type: TXT), ek ya do
   **DKIM** (Type: TXT ya CNAME) — inhe hoobahu GoDaddy DNS mein daalein.
   (Ye records prove karte hain ki emails sach mein aap hi bhej rahe hain,
   isliye Gmail/Outlook unhe spam mein nahi daalte.)
4. Resend dashboard mein "Verify DNS Records" click karein — records live
   hone mein time lagta hai (Part 1 ka note yaad rakhein).
5. Verify hone ke baad, **API Keys** section se ek SMTP-compatible key
   banayein — Resend "SMTP" tab mein seedha **Host, Port, Username,
   Password** dikha deta hai copy-paste ke liye.

### Supabase mein Custom SMTP jodna

1. Supabase dashboard → **Project Settings → Authentication → SMTP Settings**
   (kahin "Auth → Emails" ke andar bhi ho sakta hai, naam thoda alag ho
   sakta hai).
2. "Enable Custom SMTP" ON karein.
3. Resend se mile Host/Port/Username/Password bharein.
4. **Sender email**: `noreply@shaktiseshanti.com` ya `otp@shaktiseshanti.com`
   (chahe to Part 2 mein banaya hua business email bhi use kar sakte hain,
   par alag "noreply" wala rakhna zyada professional lagta hai).
5. **Sender name**: `Shakti Se Shanti Tak`.
6. Save karein — Supabase ek test email bhejne ka option deta hai, use
   zaroor try karein.

### Email templates ko apne hisaab se likhna (optional par recommended)

Supabase → **Authentication → Email Templates** mein 4 templates milengi —
**Confirm signup**, **Magic Link / OTP**, **Reset Password**, **Change
Email**. Inka default text English mein hota hai; chahe to Hindi/Hinglish
mein rewrite kar sakti hain, sirf `{{ .Token }}` (OTP code ke liye) ya
`{{ .ConfirmationURL }}` (reset link ke liye) tags ko na hataiye — wahi
asli code/link inject karte hain.

### Test kaise karein

Setup ke baad website pe khud se ek naya account signup try karein (apne
hi email se) — OTP email 10-20 second mein aana chahiye, aur "From" wala
naam `Shakti Se Shanti Tak <noreply@shaktiseshanti.com>` dikhna chahiye,
Supabase ka generic address nahi. Same tarah "Forgot Password" bhi try
karein.

✅ **Checklist — Part 3 aur 4:** Supabase project bana | 001-024 saari
migrations chal gayin (error koi bacha nahi) | Site URL/Redirect URL set |
Custom SMTP domain verify | Test signup email turant aaya, apne domain se

---

## Part 5 — Saare Environment Variables (ek jagah)

Ye woh "secret settings" hain jo Netlify mein daalni hain (Part 6 mein
bataya gaya hai kaise). Neeche table mein har ek kahan se milta hai:

| Variable | Kahan se milega | Zaroori? |
|---|---|---|
| `NODE_ENV` | Hamesha `production` likhein | ✅ Zaroori |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API (Part 3) | ✅ Zaroori |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (Part 3) | ✅ Zaroori |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (Part 3) | ✅ Zaroori |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys (Part 7) | ✅ Zaroori |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys (Part 7) | ✅ Zaroori |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Settings → Webhooks (Part 7) | ✅ Zaroori |
| `R2_ACCOUNT_ID` | Cloudflare R2 dashboard (Part 8) | ⏳ Optional |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 dashboard (Part 8) | ⏳ Optional |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 dashboard (Part 8) | ⏳ Optional |
| `R2_BUCKET_NAME` | Jo naam aap R2 bucket ko dengi (Part 8) | ⏳ Optional |
| `R2_PUBLIC_URL` | Cloudflare R2 dashboard (Part 8) | ⏳ Optional |
| `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` | Google Apps Script deploy karne ke baad (Part 9) | ⏳ Optional (bina iske daily backup nahi chalega, baaki sab chalega) |
| `GOOGLE_APPS_SCRIPT_SHARED_SECRET` | Aap khud ek random lamba text banayengi (Part 9) | ⏳ Optional (upar wale ke saath) |
| `TRUSTED_PROXY_HOPS` | Netlify pe rehte hue isse chhod dein / `0` rakhein — Netlify khud sahi IP detect kar leta hai | Optional |

R2 (Optional) **na** set karne pe bhi website poori tarah kaam karegi — photo/video
uploads Supabase Storage mein chale jaayenge, jo already free/working hai. R2
sirf tab chahiye jab bahut zyada media files ho jaayein aur cost kam karni ho.

---

## Part 6 — Netlify pe deploy karna

Netlify website ko internet pe live karta hai.

### Pehli baar deploy karna

1. **netlify.com** → Sign Up (GitHub account se sign up karna sabse aasaan
   rehta hai future updates ke liye).
2. Agar code GitHub pe hai: "Add new site" → "Import an existing project"
   → GitHub select karein → repo chunein → Netlify khud `netlify.toml` se
   build settings pad lega (`npm run build`, publish folder `dist`) — kuch
   change karne ki zaroorat nahi.
   Agar code sirf zip file mein hai (GitHub pe nahi): "Add new site" →
   "Deploy manually" → zip ke `dist` folder ko (pehle apne computer pe
   `npm run build` chala ke) drag-drop karein. **Lekin** is tarike se
   `/api/*` wale server functions kaam nahi karenge (login, payment,
   sab isi pe depend karte hain) — isliye GitHub wala tarika hi sahi hai,
   agar GitHub pe abhi tak code nahi hai to pehle GitHub.com pe free
   account banake code upload karwa lein (ya jisne website banayi thi
   unse GitHub repo mangwa lein).
3. Deploy shuru hoga aur pehli baar **fail hoga** — ye normal hai, kyunki
   environment variables abhi set nahi hui.

### Environment variables daalna

1. Netlify dashboard → apni site → **Site configuration → Environment
   variables** → "Add a variable".
2. Part 5 ke table ki saari "✅ Zaroori" wali variables ek-ek karke daalein
   (Key = variable ka naam jaisa table mein hai, Value = jo aapne copy
   kiya tha).
3. Sab daalne ke baad → **Deploys** tab → "Trigger deploy" → "Deploy site" —
   ab ye successfully build ho jaana chahiye.

### Apna domain jodna (GoDaddy → Netlify)

1. Netlify dashboard → **Domain management** → "Add a domain" → apna domain
   daalein (`shaktiseshanti.com`).
2. Netlify ek **A record** value dega (root domain `@` ke liye) aur ek
   **CNAME** value dega (`www` ke liye) — dono GoDaddy DNS mein daalein.
   (Ye values Netlify ke dashboard mein exactly wahi dikhengi jo daalni
   hain us waqt — copy-paste karein, purani kisi guide se na lein kyunki
   ye kabhi-kabhi badal jaati hain.)
3. Netlify khud-ba-khud **free SSL certificate** (https wala green lock)
   laga dega — isme kabhi-kabhi 30-60 minute lag sakte hain domain verify
   hone ke baad.

✅ **Checklist — Part 6:** Netlify pe site deploy hui aur build successful |
Saari zaroori env variables daali | Apna domain jud gaya aur https (lock
icon) kaam kar raha hai

---

## Part 7 — Razorpay live karna

Aapke paas Razorpay account already hai (KYC ho chuki hai maan ke chal rahe
hain — agar nahi hui to pehle Razorpay dashboard mein KYC complete karein,
bina uske Live mode nahi milta).

1. **razorpay.com** → Dashboard login.
2. Upar-right corner mein Test/Live mode ka toggle hota hai — shuru mein
   **Test mode** mein hi sab try karein (fake payment se poora checkout flow
   test hota hai, real paisa nahi katta).
3. **Settings → API Keys → Generate Key** (Test mode mein) — `Key Id` aur
   `Key Secret` milega. Dono `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` ke
   roop mein Netlify env variables mein daalein (Part 6).
4. **Settings → Webhooks → Add New Webhook**:
   - Webhook URL: `https://shaktiseshanti.com/api/payment/webhook`
   - Events select karein: **payment.captured**, **payment.failed**,
     **order.paid** (ye teen minimum, chahe to sab payment-related events
     bhi select kar sakti hain)
   - Save karne pe ek **Webhook Secret** milega — ise
     `RAZORPAY_WEBHOOK_SECRET` mein daalein (Part 6).
5. Test mode mein ek real checkout try karein apni hi website pe (test card
   number Razorpay docs mein milta hai: `4111 1111 1111 1111`, koi bhi future
   date/CVV) — order successfully "paid" dikhna chahiye.
6. Jab sab test ho jaaye, wahi Toggle **Live mode** pe karein, **Settings →
   API Keys** se naye **Live** keys generate karein, aur Netlify mein
   `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` ko Live wale se **replace**
   karein (Test wale ab kaam nahi karenge real customers ke liye). Webhook
   bhi Live mode ke liye alag se banana padega (step 4 repeat karein, Live
   mode mein).

✅ **Checklist — Part 7:** Test mode mein poora checkout successfully chala |
Webhook set hua aur secret Netlify mein daala | Live mode pe switch karke
naye keys/webhook set kiye

---

## Part 8 — Cloudflare R2 (Optional — media storage)

Agar abhi skip karna hai to seedha **Part 9** pe jaayein — website Supabase
Storage se hi photos/videos handle kar legi.

1. **cloudflare.com** → Sign up → left sidebar **R2**.
2. "Create bucket" → naam dein (jaise `shakti-media`).
3. Bucket → **Settings → Public Access** → "Allow Access" enable karein
   (taaki photos website pe dikhein), aur jo **Public URL** milta hai use
   copy karein → `R2_PUBLIC_URL`.
4. **Manage R2 API Tokens → Create API Token** → permissions "Object Read &
   Write" → yahi bucket select karein → create karne pe **Access Key ID**
   aur **Secret Access Key** milega → `R2_ACCESS_KEY_ID` /
   `R2_SECRET_ACCESS_KEY`.
5. Cloudflare dashboard ke right side mein apni **Account ID** dikhti hai →
   `R2_ACCOUNT_ID`.
6. Bucket ka naam hi `R2_BUCKET_NAME` hai.
7. Ye 5 values Netlify env variables mein daal ke redeploy karein (Part 6).

---

## Part 9 — Daily Backup (Google Sheet mein)

Ye website ka poora data (orders, books, users, etc.) roz ek Google Sheet
mein copy kar deta hai, extra safety ke liye.

1. **sheets.google.com** → naya blank Sheet banayein, naam dein (jaise
   "Shakti Backup").
2. Sheet ke andar: **Extensions → Apps Script**.
3. Editor mein jo bhi likha ho use pura delete karke ye paste karein —
   `SHARED_SECRET` wali line mein `REPLACE_WITH_YOUR_OWN_LONG_RANDOM_SECRET`
   ki jagah khud ek lamba random text likh dein (letters + numbers, 32+
   characters — jaise password generator se bana lein):

```javascript
var SHARED_SECRET = 'REPLACE_WITH_YOUR_OWN_LONG_RANDOM_SECRET';

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var tabsJson = JSON.stringify(body.tabs);
  var expectedSig = computeHmacSha256Hex(tabsJson, SHARED_SECRET);
  if (body.signature !== expectedSig) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'rejected', reason: 'bad signature' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var failed = [];
  body.tabs.forEach(function (t) {
    try {
      var sheet = ss.getSheetByName(t.tab) || ss.insertSheet(t.tab);
      sheet.clearContents();
      if (t.rows && t.rows.length > 0) {
        sheet.getRange(1, 1, t.rows.length, t.rows[0].length).setValues(t.rows);
      }
    } catch (err) {
      failed.push(t.tab + ': ' + err.message);
    }
  });
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', failed: failed }))
    .setMimeType(ContentService.MimeType.JSON);
}

function computeHmacSha256Hex(message, secret) {
  var rawHmac = Utilities.computeHmacSha256Signature(message, secret);
  return rawHmac.map(function (byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}
```

4. **Deploy → New deployment → gear icon → "Web app"** select karein.
5. **"Execute as": Me** | **"Who has access": Anyone**.
6. "Deploy" click karein → apni Google account se authorize karein (apni hi
   script hai, safe hai) → jo **Web App URL** milta hai use copy karein.
7. Netlify env variables mein daalein (Part 6):
   - `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` = wahi Web App URL
   - `GOOGLE_APPS_SCRIPT_SHARED_SECRET` = wahi random text jo step 3 mein
     `SHARED_SECRET` mein likha tha (bilkul same, ek letter bhi idhar-udhar
     nahi hona chahiye)
8. Redeploy karein. Backup roz automatically 20:00 (netlify.toml mein set
   hai) chalega — chahein to Netlify ke **Functions** tab se `daily-backup`
   function manually "Trigger" bhi kar sakti hain test ke liye.

---

## Part 10 — Admin MFA on karna (jab sab test ho jaaye)

Pichhle security-fix session mein admin login ke liye ek extra OTP-verification
layer add ki gayi thi, jo abhi "off" rakhi gayi hai taaki pehle test kiya ja
sake bina lock-out ke risk ke. Jab aap (ya jisne bhi admin access hai) kam se
kam ek baar admin panel mein login karke OTP verify kar chuki hon aur sab
theek lage, tab hi ise "on" karein:

Supabase → SQL Editor mein ye chalayein:
```sql
UPDATE admin_mfa_config SET enforced = true;
```
(Detail `SECURITY_FIX_STATUS.md` file mein hai jo isi zip mein hai.)

---

## Part 11 — Live hone se pehle poora test karein

- [ ] Website apne domain pe khulti hai, `https://` (lock icon) ke saath
- [ ] Naya customer account signup — OTP email turant, apne domain se aata hai
- [ ] "Forgot Password" — reset email turant aata hai, link kaam karta hai
- [ ] Ek test order place karke Razorpay se real jaisa payment karein (Test
      mode mein) — order "Paid" dikhta hai, email confirmation aata hai
- [ ] Order tracking page kaam karta hai (bina login ke bhi)
- [ ] Admin panel login hota hai, order status update ho paata hai
- [ ] Photo/video upload admin panel se kaam karta hai
- [ ] `contact@shaktiseshanti.com` pe bhejа test email aata hai aur waha se
      reply ja pata hai
- [ ] Daily backup Google Sheet mein data aa raha hai (manually trigger
      karke check karein)

Sab tick hone ke baad hi Razorpay ko **Live mode** pe switch karein
(Part 7, step 6) — real customer payment tabhi shuru karein.

---

## Part 12 — Go-Live Din

1. Razorpay Live keys + Live webhook (Part 7 step 6) Netlify mein daal ke
   redeploy karein.
2. Supabase → Authentication → URL Configuration → Site URL ko final domain
   pe confirm karein (Part 3).
3. Ek chhota real order khud se place karein (real UPI se, chhoti amount) —
   confirm ho jaaye ki paisa Razorpay account mein aa raha hai aur order
   sahi se "Paid" ho raha hai.
4. Google/Facebook jaise search engines ko batane ke liye
   `shaktiseshanti.com/sitemap.xml` khud khol ke check karein ki khul raha
   hai — phir Google Search Console (search.google.com/search-console) mein
   domain add karke sitemap submit kar dein.
5. Admin MFA on karein (Part 10) agar abhi tak nahi kiya.

Badhai ho — website ab poori tarah live hai! 🎉

---

## Baad mein: dhyaan rakhne wali cheezein

- **Migrations**: agar aage kabhi naya feature aaye jisme naya migration
  file ho (jaise `025_...sql`), use bhi Part 3 wale tarike se SQL Editor
  mein chala dena — order maintain karte hue.
- **Env variables**: agar koi service ka key/password kabhi badalna pade
  (jaise Razorpay key rotate karna), Netlify env variables mein update
  karke "Trigger deploy" zaroor karein — sirf variable badalne se site
  khud redeploy nahi hoti.
- **Backup Sheet**: mahine mein ek baar check kar lein ki naya data aa raha
  hai (kabhi Google/Apps Script side se koi permission expire ho sakti hai).
- **Domain renewal**: GoDaddy se domain ka renewal date yaad rakhein —
  expire hote hi poori website down ho jaati hai.

---

*Ye guide `shakti-se-shanti-tak-SECURITY-FIXED.zip` ke saath di gayi hai.
Technical/security-specific detail (jaise admin MFA rollout ke exact SQL
steps) ke liye usi zip ki `SECURITY_FIX_STATUS.md` file dekhein.*
