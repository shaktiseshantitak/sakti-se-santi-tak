# Cloudinary + YouTube Setup — Kya Code Mein Hua, Kya Aapko Karna Hai

## Code mein kya fix/add hua

1. **Asli bug pakda gaya**: Review video "Upload Video File" se jo video aap
   lagati thi, wo `URL.createObjectURL()` se ek temporary browser-only link
   banata tha — jo page reload hote hi (ya kisi aur device/session mein)
   **mar jaata hai**. Isliye aapka upload kiya hua video kabhi bhi
   permanently save hi nahi hota tha — admin panel mein bhi dobara khulne
   pe aur live site pe bhi kabhi nahi chalta.
2. Naya `src/lib/cloudinary.ts` bana — seedha browser se Cloudinary pe
   upload karta hai, permanent `https://` link deta hai.
3. `src/lib/storage.ts` (jo poori site ke har upload — book cover, audio,
   gallery, trailer — ke peeche hai) ab **pehle Cloudinary try karta hai**
   (agar aap setup kar dein), warna purane R2/Supabase tarike se chalta
   rahega — kuch bhi tutta nahi.
4. **Review Video section** ab Book Trailer jaisa hi hai — "YouTube Link"
   ya "Upload Video File" (Cloudinary se) choose kar sakti hain.
5. Jahan bhi review ka video dikhta hai (Admin panel ki list, aur
   `shaktiseshantitak.com/reviews` wala public page), ab system khud
   pehchaanta hai ki link YouTube ka hai ya upload kiya hua — YouTube ho to
   seedha YouTube player dikhega, upload wala ho to normal video player.

**Koi bhi purani cheez nahi tooti** — jo books pehle se hain, unki
trailer/audio sab waise hi chalengi. Ye sirf review-video ka bug fix hai +
Cloudinary ko ek naye option ke roop mein add kiya gaya hai.

---

## Aapko karna hai (sirf Cloudinary ke liye — ye dashboard wala kaam hai)

YouTube ke liye kuch setup nahi chahiye — jahan bhi "YouTube Link" button
dikhe, wahan seedha link paste kar sakti hain, turant kaam karega.

Cloudinary ke liye ek **free account** aur 2 values chahiye:

### Step 1 — Free account banayein

1. **cloudinary.com** → "Sign up for free" → apna email/Google account se
   sign up karein.
2. Sign up hote hi dashboard khulega — upar hi **"Cloud name"** likha
   dikhega (jaise `dxyz1234a`) — ise copy karke kahin save kar lein.

### Step 2 — Unsigned Upload Preset banayein

Ye zaroori hai taaki website seedha browser se upload kar sake, bina
password/secret key ke (jo safe nahi hota).

1. Dashboard mein **Settings (gear icon) → Upload** tab.
2. "Upload presets" section mein **"Add upload preset"**.
3. **Signing Mode: "Unsigned"** select karein (bahut zaroori — "Signed"
   mat rakhiye, wo server-side secret maangta hai jo humare paas nahi
   hona chahiye frontend mein).
4. Niche jo **Preset name** dikhe (jaise `ml_default` ya koi random naam)
   use copy kar lein — ya chahe to naam badal ke kuch yaad rakhne layak
   rakh lein (jaise `shakti_uploads`).
5. "Save" karein.

### Step 3 — Netlify mein 2 variables daalein

Netlify dashboard → apni site → **Site configuration → Environment
variables** → "Add a variable", ye 2 daalein:

| Key | Value |
|---|---|
| `VITE_CLOUDINARY_CLOUD_NAME` | Step 1 wala Cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Step 2 wala Preset name |

Daalne ke baad **Deploys → Trigger deploy → Deploy site** karein (naya code
deploy karte waqt bhi ye automatically include ho jaayega agar aapne pehle
se daal diya).

### Step 4 — Test karein

1. Admin panel → Reviews → "Add Review with Photo/Video" → **Upload Video
   File** → koi chhota video file chunein.
2. "Uploading..." dikhega, phir preview mein video chalna shuru ho jaana
   chahiye.
3. Review save karein, page **reload** karke dubara check karein video
   abhi bhi chal raha hai (purane bug mein yahi step fail hota tha).
4. "✓ Approved" button dabaake review ko publish karein, phir
   `shaktiseshantitak.com/reviews` pe jaake check karein wahan bhi video
   chal raha hai.

---

## Free tier kitna chalega

Cloudinary ka free plan **25 GB storage + 25 GB bandwidth/month** deta hai —
chhoti website ke review-videos aur occasional trailers ke liye bahut
zyada hai, paisa kharch karne ki abhi zaroorat nahi.

## Agar Cloudinary setup na bhi karein

Koi baat nahi — tab bhi website chalegi (purane R2/Supabase tarike se),
bas review-video upload ka bug (upar point 1) tab bhi fix rahega kyunki
hum ab real upload call karte hain, blob URL nahi — sirf "Cloudinary"
provider skip ho jaayega aur seedha R2/Supabase try hoga.
