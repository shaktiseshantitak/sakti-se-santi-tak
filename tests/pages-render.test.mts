import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const store = new Map<string,string>();
(globalThis as any).localStorage = { getItem:(k:string)=>store.get(k)??null, setItem:(k:string,v:string)=>void store.set(k,v), removeItem:(k:string)=>void store.delete(k), clear:()=>store.clear() };
(globalThis as any).window = (globalThis as any).window || { addEventListener(){}, removeEventListener(){}, location:{ search:'', pathname:'/', hostname:'localhost' }, localStorage:(globalThis as any).localStorage, matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}) };
const { BookProvider } = await import('../src/context/BookContext.tsx');
const { AuthProvider } = await import('../src/context/AuthContext.tsx');
const { GayatriSecretsSection } = await import('../src/components/home/GayatriSecretsSection.tsx');
const { CuriosityQuestionsSection } = await import('../src/components/home/CuriosityQuestionsSection.tsx');
const { CONTENT_FIELDS: CONTENT_FIELDS0 } = await import('../src/utils/siteContent.ts');
const wrap = (el:any)=>React.createElement(AuthProvider as any,null,React.createElement(BookProvider as any,null,el));
const g = renderToStaticMarkup(wrap(React.createElement(GayatriSecretsSection,{onBuyNow(){}})));
const c = renderToStaticMarkup(wrap(React.createElement(CuriosityQuestionsSection,{onBuyNow(){}, shaktiBook:{title:'शक्ति से शांति',offerPrice:499,mrp:799} as any})));
const chk=(n:string,v:boolean)=>{console.log(v?'PASS':'FAIL',n); if(!v) process.exitCode=1;};
chk('gayatri: all 5 default articles render', ['1. मंत्र का मुख्य रहस्य','2. 24 देवशक्तियों','3. सद्बुद्धि','4. अमर जल','5. दुर्गा सप्तशती'].every(s=>g.includes(s)));
chk('gayatri: **bold** became <strong>', g.includes('<strong>&quot;ॐ भूर्भुवः स्वः&quot;</strong>') || g.includes('<strong>"ॐ भूर्भुवः स्वः"</strong>'));
chk('gayatri: no stray ** left', !g.includes('**'));
const gf = (k: string) => (CONTENT_FIELDS0.find(f => f.key === k) || { fallback: '' }).fallback;
chk('gayatri: video facts + duration are kept as editable defaults (video box itself shows only once a video link is set, as before)', gf('gayatri.videoFact1') === '✓ अवधि: 18 मिनट' && gf('gayatri.videoFact2').includes('4K UHD') && gf('gayatri.videoDuration') === '18:42');
chk('curiosity: 3 questions + 3 concepts render', ['क्या आपने कभी सोचा','गुप्त ऊर्जा द्वार','असली मार्ग','विरोधाभास','Alpha Waves','Divine Aura'].every(s=>c.includes(s)));
chk('curiosity: price is LIVE from the book (499/799) and the delivery tail is kept as editable text', c.includes('₹499') && c.includes('₹799') && c.includes('फ्री डिलीवरी भारत भर में'));
console.log('gayatri html bytes', g.length, 'curiosity', c.length);

// ---- Step 4: cart / order pages ----
const { OrderSuccessPage } = await import('../src/pages/OrderSuccessPage.tsx');
const { CartPage } = await import('../src/pages/CartPage.tsx');
const { CartProvider } = await import('../src/context/CartContext.tsx');
const wrap2 = (el:any)=>React.createElement(AuthProvider as any,null,React.createElement(BookProvider as any,null,React.createElement(CartProvider as any,null,el)));
const cart = renderToStaticMarkup(wrap2(React.createElement(CartPage as any,{onNavigate(){}})));
chk('cart: empty-cart wording renders from defaults', cart.includes('Your cart is empty') && cart.includes('Browse Books Catalog'));
const os = renderToStaticMarkup(wrap2(React.createElement(OrderSuccessPage as any,{orderId:'none',onNavigate(){}})));
chk('order page: "not found" wording renders', os.includes('Order not found.'));

// ---- Step 6: remaining pages ----
const { FaqPage } = await import('../src/pages/FaqPage.tsx');
const { PoliciesPage } = await import('../src/pages/PoliciesPage.tsx');
const { WishlistPage } = await import('../src/pages/WishlistPage.tsx');
const faq = renderToStaticMarkup(wrap2(React.createElement(FaqPage as any,{onNavigate(){}})));
chk('faq: no stale ₹999, no raw {freeShipping} token (answers are collapsed except the first)', !faq.includes('₹999') && !faq.includes('{freeShipping}') && faq.includes('Frequently Asked Questions (FAQ)'));
const pol = renderToStaticMarkup(wrap2(React.createElement(PoliciesPage as any,{type:'shipping',onNavigate(){}})));
chk('policy: shipping page shows live free-shipping amount, no raw {freeShipping} token', !pol.includes('{freeShipping}') && !pol.includes('₹999') && /₹\d+ qualify/.test(pol));
const wl = renderToStaticMarkup(wrap2(React.createElement(WishlistPage as any,{onNavigate(){},onSelectBook(){},onQuickView(){}})));
chk('wishlist: wording renders from defaults', wl.includes('Saved Sacred Wishlist') && wl.includes('Your wishlist is empty'));

// ---- Final step: nothing may disappear — every auto-wired page text still shows its ORIGINAL words by default
const { CONTENT_FIELDS } = await import('../src/utils/siteContent.ts');
const { Footer } = await import('../src/components/footer/Footer.tsx');
const { BookCard } = await import('../src/components/common/BookCard.tsx');
const foot = renderToStaticMarkup(wrap2(React.createElement(Footer as any,{onNavigate(){}})));
const footFields = CONTENT_FIELDS.filter(f => f.key.startsWith('t.Footer.'));
const missing = footFields.filter(f => !foot.includes(f.fallback.replace(/&/g,'&amp;').replace(/'/g,'&#x27;')) && !foot.includes(f.fallback));
chk(`footer: all ${footFields.length} auto-wired texts still render their original words (missing: ${missing.map(m=>m.fallback.slice(0,20)).join(' | ') || 'none'})`, missing.length === 0);
