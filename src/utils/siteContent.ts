import { AUTO_CONTENT_FIELDS } from './siteContentAuto';
/**
 * Control-Panel-editable page text — ONE registry for every piece of
 * wording that used to be hardcoded.
 *
 * How it stays safe:
 *  - Only keys listed in CONTENT_FIELDS are ever read; anything else found in
 *    the database is ignored (a tampered/old row cannot add new behaviour).
 *  - Values are plain text only. Pages render them through React text nodes
 *    (auto-escaped) — never as HTML — and cleanContentMap() additionally
 *    strips control characters and caps the length on load AND on save.
 *  - Writing is admin-only: it goes through the existing siteSettings save,
 *    which the database already restricts to admin accounts.
 *
 * To make another piece of text editable: add ONE line below, then use
 * c('your.key') in the page. No migration, no new table.
 */
export interface ContentField {
  key: string;
  group: string;
  label: string;
  fallback: string;
  multiline?: boolean;
  // true = built-in text is empty, i.e. the line is simply not shown until the admin fills it
  optional?: boolean;
  // longer than the default 600 characters (auto-wired paragraphs)
  maxLen?: number;
}

export const CONTENT_MAX_LEN = 600;

const MANUAL_CONTENT_FIELDS: ContentField[] = [
  // ---------------- Home: highlight strip ----------------
  { key: 'home.spotlightBadge', group: 'होम पेज: ग्रंथ परिचय पट्टी', label: 'छोटा बैज', fallback: '100% प्रामाणिक वैदिक ग्रंथ • हार्डकवर संस्करण' },
  { key: 'home.spotlightReadMore', group: 'होम पेज: ग्रंथ परिचय पट्टी', label: 'बटन का शब्द', fallback: 'पूरा विवरण एवं विषय-सूची पढ़ें' },

  // ---------------- Home: Why this book ----------------
  { key: 'trust.badge', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'छोटा बैज', fallback: 'विशेषता एवं प्रामाणिकता' },
  { key: 'trust.title', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'मुख्य शीर्षक', fallback: 'यह पुस्तक ही क्यों? (Why This Book?)' },
  { key: 'trust.subtitle', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'उप-शीर्षक', fallback: 'आध्यात्मिक दृष्टिकोण एवं साधना परंपरा के गहन अनुशीलन पर आधारित चार मुख्य आधार स्तंभ।', multiline: true },
  { key: 'trust.p1Title', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 1 - शीर्षक', fallback: 'सरल एवं सुबोध भाषा' },
  { key: 'trust.p1Text', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 1 - विवरण', fallback: 'संस्कृत ग्रंथों के जटिल रहस्यों को अत्यंत सरल, स्पष्ट और व्यावहारिक हिंदी भाषा में प्रस्तुत किया गया है।', multiline: true },
  { key: 'trust.p2Title', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 2 - शीर्षक', fallback: 'गहन आध्यात्मिक चिंतन' },
  { key: 'trust.p2Text', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 2 - विवरण', fallback: 'मंत्र जाप के केवल बाह्य उच्चारण से आगे बढ़कर आभ्यंतर चेतना और मानसिक एकाग्रता का गूढ़ विश्लेषण।', multiline: true },
  { key: 'trust.p3Title', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 3 - शीर्षक', fallback: 'शांति और आत्मचिंतन की प्रेरणा' },
  { key: 'trust.p3Text', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 3 - विवरण', fallback: 'दैनिक जीवन के तनाव, अशांति और भटकाव से मुक्त होकर अंतर्मन में स्थायी शांति प्राप्त करने का मार्ग।', multiline: true },
  { key: 'trust.p4Title', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 4 - शीर्षक', fallback: 'आध्यात्मिक साधकों हेतु उपयोगी' },
  { key: 'trust.p4Text', group: 'होम पेज: यह पुस्तक ही क्यों?', label: 'बिंदु 4 - विवरण', fallback: 'नवीन साधकों से लेकर वर्षों से अभ्यास कर रहे साधकों एवं अध्यात्म प्रेमी पाठकों के लिए एक प्रामाणिक मार्गदर्शिका।', multiline: true },

  // ---------------- Home: Buy section ----------------
  { key: 'buy.shippingNote', group: 'होम पेज: खरीदें (Buy) सेक्शन', label: 'डिलीवरी/COD पंक्ति (सिर्फ़ वही लिखें जो सच हो)', fallback: '✅ नि:शुल्क एक्सप्रेस डिलीवरी (Free Shipping Across India) • सुरक्षित कैश ऑन डिलीवरी (COD Available)', multiline: true },
  { key: 'buy.buyNow', group: 'होम पेज: खरीदें (Buy) सेक्शन', label: 'खरीदें बटन', fallback: 'अभी पुस्तक प्राप्त करें (Buy Now)' },
  { key: 'buy.whatsapp', group: 'होम पेज: खरीदें (Buy) सेक्शन', label: 'WhatsApp बटन', fallback: 'WhatsApp पर प्रश्न पूछें' },
  { key: 'buy.deliveryNote', group: 'होम पेज: खरीदें (Buy) सेक्शन', label: 'डिलीवरी समय (सिर्फ़ वही लिखें जो सच हो)', fallback: '2-4 दिनों में संपूर्ण भारत डिलीवरी' },
  { key: 'buy.secureNote', group: 'होम पेज: खरीदें (Buy) सेक्शन', label: 'भुगतान सुरक्षा पंक्ति', fallback: '100% सुरक्षित भुगतान' },

  // ---------------- Contact page ----------------
  { key: 'contact.breadcrumb', group: 'संपर्क (Contact) पेज', label: 'Breadcrumb नाम', fallback: 'Contact Us & Press Desk' },
  { key: 'contact.title', group: 'संपर्क (Contact) पेज', label: 'मुख्य शीर्षक', fallback: 'Get in Touch with Our Publishing Desk' },
  { key: 'contact.subtitle', group: 'संपर्क (Contact) पेज', label: 'उप-शीर्षक', fallback: 'Questions about order tracking, bulk temple distribution, or manuscript submissions?', multiline: true },
  { key: 'contact.hqTitle', group: 'संपर्क (Contact) पेज', label: 'बाएँ कार्ड का शीर्षक', fallback: 'Varanasi Headquarters' },
  { key: 'contact.officeLabel', group: 'संपर्क (Contact) पेज', label: 'पता - लेबल', fallback: 'Main Office & Press:' },
  { key: 'contact.phoneLabel', group: 'संपर्क (Contact) पेज', label: 'फोन - लेबल', fallback: 'Helpline Phone:' },
  { key: 'contact.phoneHours', group: 'संपर्क (Contact) पेज', label: 'फोन के बाद का समय', fallback: '(Mon-Sat 9 AM - 7 PM IST)' },

  // ---------------- Footer ----------------
  { key: 'footer.nlKicker', group: 'फुटर', label: 'न्यूज़लेटर - छोटा शीर्षक', fallback: 'ॐ Sacred Knowledge Updates' },
  { key: 'footer.nlTitle', group: 'फुटर', label: 'न्यूज़लेटर - मुख्य शीर्षक', fallback: 'Subscribe to Daily Verse & Spiritual Releases' },
  { key: 'footer.nlText', group: 'फुटर', label: 'न्यूज़लेटर - विवरण', fallback: 'Receive weekly commentary on Bhagavad Gita, notifications on rare manuscript printings, and exclusive 15% discount codes for new scripture releases.', multiline: true },
  { key: 'footer.colCategories', group: 'फुटर', label: 'कॉलम 2 शीर्षक', fallback: 'Sacred Scripture Categories' },
  { key: 'footer.colCustomer', group: 'फुटर', label: 'कॉलम 3 शीर्षक', fallback: 'Customer & Readers' },
  { key: 'footer.colPolicies', group: 'फुटर', label: 'कॉलम 4 शीर्षक', fallback: 'Store Policies & SEO' },
  { key: 'footer.nlPlaceholder', group: 'फुटर', label: 'न्यूज़लेटर - email बॉक्स का सुझाव', fallback: 'Enter your email address...' },
  { key: 'footer.nlButton', group: 'फुटर', label: 'न्यूज़लेटर - बटन', fallback: 'Join' },
  { key: 'footer.nlSuccess', group: 'फुटर', label: 'न्यूज़लेटर - सफलता संदेश', fallback: 'Subscribed!' },
  { key: 'footer.nlConsent', group: 'फुटर', label: 'न्यूज़लेटर - सहमति पंक्ति (privacy)', fallback: 'जुड़कर आप हमारी Privacy Policy से सहमत हैं। कभी भी हटने के लिए हमें लिखें।', multiline: true },
  { key: 'footer.linkAffiliate', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Affiliate लिंक', fallback: 'Affiliate Partner Program (अफ़िलिएट पार्टनर बनें - 3-Tier)' },
  { key: 'footer.linkDashboard', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Customer Dashboard', fallback: 'Customer Dashboard' },
  { key: 'footer.linkTrack', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Order Tracking', fallback: 'Track Your Order Status' },
  { key: 'footer.linkAuthors', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Authors', fallback: 'Revered Authors & Translators' },
  { key: 'footer.linkBlog', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Blog', fallback: 'Spiritual Blog & News' },
  { key: 'footer.linkGallery', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Gallery', fallback: 'Photo & Printing Press Gallery' },
  { key: 'footer.linkFaq', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'FAQ', fallback: 'Frequently Asked Questions (FAQ)' },
  { key: 'footer.linkPrivacy', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Privacy Policy', fallback: 'Privacy Policy' },
  { key: 'footer.linkTerms', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Terms', fallback: 'Terms & Conditions' },
  { key: 'footer.linkShipping', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Shipping Policy', fallback: 'Shipping & Dispatch Policy' },
  { key: 'footer.linkReturn', group: 'फुटर: लिंक के नाम (एक space = लिंक छुपाएँ)', label: 'Return Policy', fallback: 'Returns & Refunds Policy' },

  { key: 'gayatri.badge', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'छोटा बैज', fallback: 'आध्यात्मिक लेख एवं अंतर्मन का गुप्त रहस्य' },
  { key: 'gayatri.titleA', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'शीर्षक - पहला हिस्सा', fallback: 'गायत्री महामंत्र का रहस्य एवं' },
  { key: 'gayatri.titleB', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'शीर्षक - चमकता (सुनहरा) हिस्सा', fallback: '24 देवशक्तियाँ' },
  { key: 'gayatri.subtitle', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'उप-शीर्षक', fallback: 'वेदों की ऋचाओं से लेकर आधुनिक विज्ञान की खोजों तक—जानिए क्यों गायत्री और दुर्गा मंत्र मानव चेतना का सर्वोपरि रहस्य हैं।', multiline: true },
  { key: 'gayatri.videoBadge', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो बैज (वीडियो link लगाने पर दिखता है)', fallback: 'विशेष वीडियो व्याख्यान (Special Video Presentation)' },
  { key: 'gayatri.videoTitle', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो शीर्षक', fallback: 'गायत्री मंत्र एवं दुर्गा मंत्र की अंतयात्रा का गुप्त रहस्य (Video)' },
  { key: 'gayatri.videoText', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो विवरण', fallback: 'देखिए कैसे गायत्री और दुर्गा मंत्र के सही स्पंदन आपके जीवन को बदल सकते हैं। इस वीडियो में स्वामी जी एवं आचार्यों द्वारा व्यावहारिक मार्गदर्शन दिया गया है।', multiline: true },
  { key: 'gayatri.videoFact1', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो खूबी 1 (सिर्फ़ वही लिखें जो सच हो; एक space = छुपाएँ)', fallback: '✓ अवधि: 18 मिनट' },
  { key: 'gayatri.videoFact2', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो खूबी 2', fallback: '✓ 4K UHD प्रामाणिक ऑडियो' },
  { key: 'gayatri.videoFact3', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो खूबी 3', fallback: '✓ 100% नि:शुल्क दृश्य' },
  { key: 'gayatri.videoDuration', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो थंबनेल पर समय (अपने वीडियो का असली समय लिखें; एक space = छुपाएँ)', fallback: '18:42' },
  { key: 'gayatri.videoClose', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'वीडियो विंडो का शीर्षक', fallback: 'गायत्री मंत्र एवं दुर्गा मंत्र का अंतयात्रा रहस्य' },
  { key: 'gayatri.buy', group: 'गायत्री रहस्य पेज: शीर्षक और बटन', label: 'खरीदें बटन', fallback: 'इन रहस्यों को गहराई से समझें — अभी ग्रंथ प्राप्त करें (Buy Now)' },
  { key: 'curiosity.badge', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'छोटा बैज', fallback: 'जिज्ञासा पैदा करने वाले सवाल एवं गहन सत्य' },
  { key: 'curiosity.titleA', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'शीर्षक - पहला हिस्सा', fallback: 'अंतर्मन के वे सवाल जो आपकी साधना का' },
  { key: 'curiosity.titleB', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'शीर्षक - रंगीन हिस्सा', fallback: 'दृष्टिकोण बदल देंगे' },
  { key: 'curiosity.subtitle', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'उप-शीर्षक', fallback: 'क्या आपकी साधना आपको वह परम शांति दे पा रही है जिसकी खोज में आप हैं? जानिए इस ग्रंथ के पन्नों में छिपे रहस्य।', multiline: true },
  { key: 'curiosity.cardOpen', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'चुना हुआ कार्ड - नीचे का शब्द', fallback: 'सत्य उजागर हुआ ✓' },
  { key: 'curiosity.cardClosed', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'न चुना हुआ कार्ड - नीचे का शब्द', fallback: 'रहस्य पढ़ने के लिए क्लिक करें →' },
  { key: 'curiosity.ctaTitle', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'नीचे की मुख्य पंक्ति', fallback: 'अपनी साधना को आज ही सही दिशा दें और आंतरिक रहस्यों को खोलें।', multiline: true },
  { key: 'curiosity.ctaPrice', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'कीमत की पंक्ति (अपने-आप असली कीमत: {price} {mrp} {title} लिख सकते हैं)', fallback: "मूल ग्रंथ 'शक्ति से शांति' केवल ₹{price} में उपलब्ध (मूल्य ₹{mrp}) | फ्री डिलीवरी भारत भर में", multiline: true },
  { key: 'curiosity.ctaButton', group: 'जिज्ञासा पेज: शीर्षक और बटन', label: 'खरीदें बटन', fallback: 'अभी प्राप्त करें (Buy Now)' },

  { key: 'cart.emptyTitle', group: 'कार्ट', label: 'खाली कार्ट - शीर्षक', fallback: 'Your cart is empty' },
  { key: 'cart.emptyText', group: 'कार्ट', label: 'खाली कार्ट - विवरण', fallback: 'Browse our sacred scriptures to begin your journey.', multiline: true },
  { key: 'cart.browse', group: 'कार्ट', label: 'खाली कार्ट - बटन', fallback: 'Browse Books Catalog' },
  { key: 'cart.clear', group: 'कार्ट', label: 'Cart खाली करें', fallback: 'Clear Cart' },
  { key: 'cart.continue', group: 'कार्ट', label: 'खरीदारी जारी रखें', fallback: '← Continue Shopping' },
  { key: 'cart.summary', group: 'कार्ट', label: 'ऑर्डर सारांश शीर्षक', fallback: 'Order Summary' },
  { key: 'cart.couponPlaceholder', group: 'कार्ट', label: 'Coupon बॉक्स का सुझाव', fallback: 'Coupon Code' },
  { key: 'cart.apply', group: 'कार्ट', label: 'Apply बटन', fallback: 'Apply' },
  { key: 'cart.subtotal', group: 'कार्ट', label: 'Subtotal', fallback: 'Subtotal' },
  { key: 'cart.discount', group: 'कार्ट', label: 'Discount', fallback: 'Discount' },
  { key: 'cart.gst', group: 'कार्ट', label: 'GST पंक्ति ({rate} = असली दर अपने-आप)', fallback: 'GST Tax ({rate}%)' },
  { key: 'cart.shipping', group: 'कार्ट', label: 'Shipping', fallback: 'Shipping' },
  { key: 'cart.free', group: 'कार्ट', label: 'मुफ्त शिपिंग का शब्द', fallback: 'FREE' },
  { key: 'cart.total', group: 'कार्ट', label: 'कुल राशि', fallback: 'Total Pay' },
  { key: 'cart.checkout', group: 'कार्ट', label: 'Checkout बटन', fallback: 'Proceed to Checkout' },
  { key: 'drawer.emptyText', group: 'कार्ट ड्रॉअर (साइड पैनल)', label: 'खाली कार्ट - विवरण', fallback: 'Explore our sacred scripture catalog of Bhagavad Gita, Ramayana, and Upanishads to begin your journey.', multiline: true },
  { key: 'drawer.discount', group: 'कार्ट ड्रॉअर (साइड पैनल)', label: 'Discount', fallback: 'Coupon Discount' },
  { key: 'drawer.gst', group: 'कार्ट ड्रॉअर (साइड पैनल)', label: 'GST पंक्ति ({rate} = असली दर)', fallback: 'Estimated GST Tax ({rate}%)' },
  { key: 'drawer.shipping', group: 'कार्ट ड्रॉअर (साइड पैनल)', label: 'Shipping', fallback: 'Shipping Fee' },
  { key: 'drawer.total', group: 'कार्ट ड्रॉअर (साइड पैनल)', label: 'कुल राशि', fallback: 'Total Amount' },
  { key: 'drawer.secure', group: 'कार्ट ड्रॉअर (साइड पैनल)', label: 'सुरक्षा पंक्ति (सिर्फ़ वही लिखें जो सच हो)', fallback: 'Encrypted 256-bit Secure Checkout' },
  { key: 'checkout.title', group: 'चेकआउट पेज', label: 'पेज शीर्षक', fallback: 'Checkout & Order Confirmation' },
  { key: 'checkout.step1', group: 'चेकआउट पेज', label: 'चरण 1 शीर्षक', fallback: 'Shipping Address Details' },
  { key: 'checkout.step2', group: 'चेकआउट पेज', label: 'चरण 2 शीर्षक', fallback: 'Logistics Courier Partner' },
  { key: 'checkout.step3', group: 'चेकआउट पेज', label: 'चरण 3 शीर्षक', fallback: 'Payment Gateway Mode' },
  { key: 'checkout.lblName', group: 'चेकआउट पेज', label: 'लेबल: नाम', fallback: 'Full Name *' },
  { key: 'checkout.lblPhone', group: 'चेकआउट पेज', label: 'लेबल: फोन', fallback: 'Mobile Phone *' },
  { key: 'checkout.lblEmail', group: 'चेकआउट पेज', label: 'लेबल: ईमेल', fallback: 'Email Address *' },
  { key: 'checkout.lblPincode', group: 'चेकआउट पेज', label: 'लेबल: पिनकोड', fallback: 'Pincode *' },
  { key: 'checkout.lblAddress', group: 'चेकआउट पेज', label: 'लेबल: पता', fallback: 'Address Line 1 *' },
  { key: 'checkout.lblCity', group: 'चेकआउट पेज', label: 'लेबल: शहर', fallback: 'City *' },
  { key: 'checkout.lblState', group: 'चेकआउट पेज', label: 'लेबल: राज्य', fallback: 'State *' },
  { key: 'checkout.subtotal', group: 'चेकआउट पेज', label: 'Subtotal', fallback: 'Subtotal' },
  { key: 'checkout.discount', group: 'चेकआउट पेज', label: 'Discount', fallback: 'Discount' },
  { key: 'checkout.gst', group: 'चेकआउट पेज', label: 'GST पंक्ति ({rate} = असली दर)', fallback: 'GST Tax ({rate}%)' },
  { key: 'checkout.free', group: 'चेकआउट पेज', label: 'मुफ्त शिपिंग का शब्द', fallback: 'FREE' },
  { key: 'checkout.total', group: 'चेकआउट पेज', label: 'कुल राशि', fallback: 'Total Amount' },
  { key: 'order.notFound', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'ऑर्डर न मिलने पर संदेश', fallback: 'Order not found.' },
  { key: 'order.badge', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'सफलता बैज', fallback: 'Order Confirmed & Sacred Package In Preparation' },
  { key: 'order.thanks', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'धन्यवाद शीर्षक', fallback: 'Thank You for Your Order!' },
  { key: 'order.print', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'Print बटन', fallback: 'Print Tax Invoice' },
  { key: 'order.track', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'Track बटन', fallback: 'Track Live Delivery Status' },
  { key: 'invoice.company', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'इनवॉइस: कंपनी/ब्रांड का नाम', fallback: 'ॐ शक्ति से शांति तक' },
  { key: 'invoice.address', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'इनवॉइस: पता (खाली = Settings वाला पता)', fallback: '', optional: true },
  { key: 'invoice.gstin', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'इनवॉइस: GSTIN (खाली = यह पंक्ति नहीं दिखेगी — केवल अपना असली GSTIN लिखें)', fallback: '', optional: true },
  { key: 'invoice.title', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'इनवॉइस शीर्षक (GST पंजीकरण न हो तो "INVOICE" लिखें)', fallback: 'TAX INVOICE' },
  { key: 'invoice.grandTotal', group: 'ऑर्डर सफल पेज एवं इनवॉइस', label: 'कुल राशि पंक्ति', fallback: 'Grand Total Paid' },
  { key: 'wishlist.breadcrumb', group: 'विशलिस्ट पेज', label: 'Breadcrumb नाम', fallback: 'Saved Wishlist' },
  { key: 'wishlist.title', group: 'विशलिस्ट पेज', label: 'शीर्षक (संख्या अपने-आप जुड़ती है)', fallback: 'Saved Sacred Wishlist' },
  { key: 'wishlist.subtitle', group: 'विशलिस्ट पेज', label: 'उप-शीर्षक', fallback: 'Books you have saved for future study or gifts.' },
  { key: 'wishlist.emptyTitle', group: 'विशलिस्ट पेज', label: 'खाली होने पर शीर्षक', fallback: 'Your wishlist is empty' },
  { key: 'wishlist.emptyText', group: 'विशलिस्ट पेज', label: 'खाली होने पर विवरण', fallback: 'Click the heart icon on any book card to save it here.' },
  { key: 'wishlist.explore', group: 'विशलिस्ट पेज', label: 'खाली होने पर बटन', fallback: 'Explore Catalog' },
  { key: 'books.filter', group: 'ग्रंथ कैटलॉग पेज', label: 'खोज बॉक्स का सुझाव', fallback: 'Filter by title, author, or verse...' },
  { key: 'books.sortBy', group: 'ग्रंथ कैटलॉग पेज', label: 'Sort लेबल', fallback: 'Sort by:' },
  { key: 'books.sortPopular', group: 'ग्रंथ कैटलॉग पेज', label: 'Sort: Popular', fallback: 'Most Popular' },
  { key: 'books.sortLow', group: 'ग्रंथ कैटलॉग पेज', label: 'Sort: Low to High', fallback: 'Price: Low to High' },
  { key: 'books.sortHigh', group: 'ग्रंथ कैटलॉग पेज', label: 'Sort: High to Low', fallback: 'Price: High to Low' },
  { key: 'books.sortRated', group: 'ग्रंथ कैटलॉग पेज', label: 'Sort: Rated', fallback: 'Highest Rated' },
  { key: 'books.sortNew', group: 'ग्रंथ कैटलॉग पेज', label: 'Sort: Newest', fallback: 'Newest Additions' },
  { key: 'books.fCategory', group: 'ग्रंथ कैटलॉग पेज', label: 'फ़िल्टर: Category', fallback: 'Category' },
  { key: 'books.fFormat', group: 'ग्रंथ कैटलॉग पेज', label: 'फ़िल्टर: Format', fallback: 'Format' },
  { key: 'books.fLanguage', group: 'ग्रंथ कैटलॉग पेज', label: 'फ़िल्टर: Language', fallback: 'Language' },
  { key: 'books.fPrice', group: 'ग्रंथ कैटलॉग पेज', label: 'फ़िल्टर: Max Price', fallback: 'Max Price' },
  { key: 'books.noneTitle', group: 'ग्रंथ कैटलॉग पेज', label: 'कुछ न मिलने पर शीर्षक', fallback: 'No books match your current filters' },
  { key: 'books.noneText', group: 'ग्रंथ कैटलॉग पेज', label: 'कुछ न मिलने पर विवरण', fallback: 'Try adjusting your price slider or resetting category filters.' },
  { key: 'books.reset', group: 'ग्रंथ कैटलॉग पेज', label: 'Reset बटन', fallback: 'Reset All Filters' },
  { key: 'blog.breadcrumb', group: 'ब्लॉग पेज', label: 'Breadcrumb नाम', fallback: 'Spiritual Blog & Articles' },
  { key: 'blog.title', group: 'ब्लॉग पेज', label: 'शीर्षक', fallback: 'Spiritual Blog & Vedic Insights' },
  { key: 'blog.subtitle', group: 'ब्लॉग पेज', label: 'उप-शीर्षक', fallback: 'Deep-dive articles on Gita philosophy, Sanskrit linguistics, and temple history.', multiline: true },
  { key: 'blog.search', group: 'ब्लॉग पेज', label: 'खोज बॉक्स का सुझाव', fallback: 'Search articles...' },
  { key: 'faq.breadcrumb', group: 'FAQ पेज (प्रश्न-उत्तर अलग से FAQ मैनेजर में)', label: 'Breadcrumb नाम', fallback: 'Frequently Asked Questions' },
  { key: 'faq.title', group: 'FAQ पेज (प्रश्न-उत्तर अलग से FAQ मैनेजर में)', label: 'शीर्षक', fallback: 'Frequently Asked Questions (FAQ)' },
  { key: 'faq.subtitle', group: 'FAQ पेज (प्रश्न-उत्तर अलग से FAQ मैनेजर में)', label: 'उप-शीर्षक', fallback: 'Answers to common questions about our printing press, authentic translations, and shipping.', multiline: true },
  { key: 'faq.search', group: 'FAQ पेज (प्रश्न-उत्तर अलग से FAQ मैनेजर में)', label: 'खोज बॉक्स का सुझाव', fallback: 'Search questions (e.g. shipping, Sanskrit, binding)...' },
  { key: 'gallery.breadcrumb', group: 'गैलरी पेज', label: 'Breadcrumb नाम', fallback: 'Photo & Printing Press Gallery' },
  { key: 'track.breadcrumb', group: 'ऑर्डर ट्रैकिंग पेज', label: 'Breadcrumb नाम', fallback: 'Track Order Status' },
  { key: 'track.title', group: 'ऑर्डर ट्रैकिंग पेज', label: 'शीर्षक', fallback: 'Live Order Tracking' },
  { key: 'track.subtitle', group: 'ऑर्डर ट्रैकिंग पेज', label: 'उप-शीर्षक', fallback: 'Enter your Order ID (e.g. DH-2024-9841) or Courier Tracking Code.' },
  { key: 'track.idPlaceholder', group: 'ऑर्डर ट्रैकिंग पेज', label: 'Order ID बॉक्स का सुझाव', fallback: 'Tracking Code or Order ID...' },
  { key: 'track.contactPlaceholder', group: 'ऑर्डर ट्रैकिंग पेज', label: 'Email/Phone बॉक्स का सुझाव', fallback: 'Verification Email or Phone (Required for Guest Lookup)...' },
  { key: 'track.privacy', group: 'ऑर्डर ट्रैकिंग पेज', label: 'गोपनीयता पंक्ति', fallback: 'For your privacy, address and payment details are only shown after you log in to the account that placed this order.', multiline: true },
  { key: 'dash.breadcrumb', group: 'कस्टमर डैशबोर्ड', label: 'Breadcrumb नाम', fallback: 'Customer Account Dashboard' },
  { key: 'dash.loginTitle', group: 'कस्टमर डैशबोर्ड', label: 'लॉगिन से पहले शीर्षक', fallback: 'Please Log In' },
  { key: 'dash.loginText', group: 'कस्टमर डैशबोर्ड', label: 'लॉगिन से पहले विवरण', fallback: 'You need to sign in to view your dashboard, orders, and the Affiliate & Referral Portal.', multiline: true },
  { key: 'dash.orders', group: 'कस्टमर डैशबोर्ड', label: 'ऑर्डर सेक्शन का शीर्षक', fallback: 'Your Recent Scripture Orders' },
  { key: 'dash.invoice', group: 'कस्टमर डैशबोर्ड', label: 'Invoice बटन', fallback: 'Invoice / Details' },
  { key: 'dash.profile', group: 'कस्टमर डैशबोर्ड', label: 'प्रोफ़ाइल सेक्शन का शीर्षक', fallback: 'Personal Profile Details' },
  { key: 'dash.addresses', group: 'कस्टमर डैशबोर्ड', label: 'पते सेक्शन का शीर्षक', fallback: 'Saved Delivery Addresses' },
  { key: 'reset.title', group: 'पासवर्ड रीसेट पेज', label: 'शीर्षक', fallback: 'नया पासवर्ड सेट करें' },
  { key: 'reset.back', group: 'पासवर्ड रीसेट पेज', label: 'वापस जाने का बटन', fallback: 'लॉगिन पेज पर वापस जाएँ' },
  { key: 'reset.newPass', group: 'पासवर्ड रीसेट पेज', label: 'लेबल: नया पासवर्ड', fallback: 'नया पासवर्ड' },
  { key: 'reset.repeatPass', group: 'पासवर्ड रीसेट पेज', label: 'लेबल: पासवर्ड दोबारा', fallback: 'पासवर्ड दोबारा डालें' },
  { key: 'confirm.okTitle', group: 'ईमेल पुष्टि पेज', label: 'सफलता शीर्षक', fallback: 'ईमेल की पुष्टि हो गई! ✓' },
  { key: 'confirm.okText', group: 'ईमेल पुष्टि पेज', label: 'सफलता विवरण', fallback: 'आपका खाता सफलतापूर्वक सक्रिय हो गया है। अब आप खरीदारी शुरू कर सकते हैं।', multiline: true },
  { key: 'confirm.openAccount', group: 'ईमेल पुष्टि पेज', label: 'खाता खोलने का बटन', fallback: 'मेरा खाता खोलें' },
  { key: 'confirm.badTitle', group: 'ईमेल पुष्टि पेज', label: 'विफल होने पर शीर्षक', fallback: 'यह लिंक अमान्य या समय-सीमा समाप्त हो चुका है' },
  { key: 'confirm.badText', group: 'ईमेल पुष्टि पेज', label: 'विफल होने पर विवरण', fallback: 'कृपया दोबारा साइन अप करें, या लॉगिन करने की कोशिश करें।' },
  { key: 'confirm.toLogin', group: 'ईमेल पुष्टि पेज', label: 'लॉगिन का बटन', fallback: 'लॉगिन पेज पर जाएँ' },
  { key: 'book.addToCart', group: 'ग्रंथ विवरण पेज', label: 'Cart बटन', fallback: 'Add to Shopping Cart' },
  { key: 'book.formatLabel', group: 'ग्रंथ विवरण पेज', label: 'लेबल: Format', fallback: 'Select Format:' },
  { key: 'book.langLabel', group: 'ग्रंथ विवरण पेज', label: 'लेबल: भाषा/लिपि', fallback: 'Select Language Script:' },
  { key: 'book.tabDesc', group: 'ग्रंथ विवरण पेज', label: 'टैब: विवरण', fallback: 'Description & Commentary' },
  { key: 'book.tabSpecs', group: 'ग्रंथ विवरण पेज', label: 'टैब: विनिर्देश', fallback: 'Specifications & ISBN' },
  { key: 'book.reviewTitle', group: 'ग्रंथ विवरण पेज', label: 'समीक्षा फ़ॉर्म का शीर्षक', fallback: 'Submit Your Reader Reflection' },
  { key: 'book.reviewSub', group: 'ग्रंथ विवरण पेज', label: 'समीक्षा फ़ॉर्म का उप-शीर्षक', fallback: 'Share your experience reading this sacred volume.' },
  { key: 'book.related', group: 'ग्रंथ विवरण पेज', label: 'संबंधित ग्रंथ का शीर्षक', fallback: 'Related Sacred Scripture Publications' },
  { key: 'book.freeSample', group: 'ग्रंथ विवरण पेज', label: 'बटन: Free PDF Sample', fallback: 'Free PDF Sample' },
  { key: 'book.audio', group: 'ग्रंथ विवरण पेज', label: 'बटन: Chanted Audio', fallback: 'Chanted Audio' },
  { key: 'book.verified', group: 'ग्रंथ विवरण पेज', label: 'बैज: Verified Edition (सिर्फ़ वही लिखें जो सच हो)', fallback: '✓ Verified Edition' },
  { key: 'book.dispatch', group: 'ग्रंथ विवरण पेज', label: 'डिस्पैच पंक्ति (सिर्फ़ वही लिखें जो सच हो)', fallback: 'Dispatched within 24 Hours from Varanasi' },
  { key: 'book.specIsbn', group: 'ग्रंथ विवरण पेज', label: 'Specs: ISBN', fallback: 'ISBN Code:' },
  { key: 'book.specPublisher', group: 'ग्रंथ विवरण पेज', label: 'Specs: Publisher', fallback: 'Publisher:' },
  { key: 'book.specYear', group: 'ग्रंथ विवरण पेज', label: 'Specs: Year', fallback: 'Publication Year:' },
  { key: 'book.specEdition', group: 'ग्रंथ विवरण पेज', label: 'Specs: Edition', fallback: 'Edition:' },
  { key: 'book.specPages', group: 'ग्रंथ विवरण पेज', label: 'Specs: Pages', fallback: 'Number of Pages:' },
  { key: 'book.specWeight', group: 'ग्रंथ विवरण पेज', label: 'Specs: Weight', fallback: 'Weight:' },
  { key: 'book.specDimensions', group: 'ग्रंथ विवरण पेज', label: 'Specs: Dimensions', fallback: 'Dimensions:' },
  { key: 'track.lblCourier', group: 'ऑर्डर ट्रैकिंग पेज', label: 'लेबल: Courier', fallback: 'Courier:' },
  { key: 'track.lblExpected', group: 'ऑर्डर ट्रैकिंग पेज', label: 'लेबल: Expected Delivery', fallback: 'Expected Delivery:' },
  { key: 'track.lblPayment', group: 'ऑर्डर ट्रैकिंग पेज', label: 'कार्ड शीर्षक: Payment', fallback: 'Payment' },
  { key: 'track.lblMethod', group: 'ऑर्डर ट्रैकिंग पेज', label: 'लेबल: Method', fallback: 'Method:' },
  { key: 'track.lblStatus', group: 'ऑर्डर ट्रैकिंग पेज', label: 'लेबल: Status', fallback: 'Status:' },
  { key: 'track.lblShipTo', group: 'ऑर्डर ट्रैकिंग पेज', label: 'कार्ड शीर्षक: Shipping Address', fallback: 'Shipping Address' },
  { key: 'book.publishedBy', group: 'ग्रंथ विवरण पेज', label: '"• Published by" शब्द', fallback: '• Published by' },
  { key: 'track.lblCode', group: 'ऑर्डर ट्रैकिंग पेज', label: 'लेबल: Tracking Code', fallback: 'Tracking Code:' },
  { key: 'track.lblOrderStatus', group: 'ऑर्डर ट्रैकिंग पेज', label: 'लेबल: Order Status', fallback: 'Order Status:' },
  { key: 'crumb.catalog', group: 'मार्ग-सूचक (Breadcrumb) नाम', label: 'Books Catalog', fallback: 'Books Catalog' },
  { key: 'crumb.blog', group: 'मार्ग-सूचक (Breadcrumb) नाम', label: 'Blog', fallback: 'Blog' },
  { key: 'crumb.cart', group: 'मार्ग-सूचक (Breadcrumb) नाम', label: 'Cart', fallback: 'Cart' },
  { key: 'crumb.cartPage', group: 'मार्ग-सूचक (Breadcrumb) नाम', label: 'Shopping Cart', fallback: 'Shopping Cart' },
  { key: 'crumb.checkout', group: 'मार्ग-सूचक (Breadcrumb) नाम', label: 'Secure Checkout', fallback: 'Secure Checkout' },

  // ---------------- Other pages ----------------
  { key: 'policies.lastUpdated', group: 'नीति (Policy) पेज', label: 'शीर्षक के नीचे की पंक्ति', fallback: 'Last Updated: August 2024 • Shakti Se Shanti Tak Varanasi Desk' },
  { key: 'book.guarantee', group: 'ग्रंथ विवरण पेज', label: 'गारंटी पंक्ति (सिर्फ़ वही लिखें जो सच हो)', fallback: '100% Sanskrit Text Accuracy Guaranteed' },
  { key: 'menu.title', group: 'मोबाइल मेन्यू', label: 'मेन्यू का शीर्षक', fallback: 'मुख्य नेविगेशन मेन्यू (Navigation)' },
];

export const CONTENT_FIELDS: ContentField[] = [...MANUAL_CONTENT_FIELDS, ...AUTO_CONTENT_FIELDS];

const ALLOWED_KEYS = new Set(CONTENT_FIELDS.map(f => f.key));
const MAX_LEN: Record<string, number> = Object.fromEntries(CONTENT_FIELDS.map(f => [f.key, f.maxLen ?? CONTENT_MAX_LEN]));
const FALLBACKS: Record<string, string> = Object.fromEntries(CONTENT_FIELDS.map(f => [f.key, f.fallback]));

/** Control characters out, length capped. Keeps a lone space (= "hide this text"). */
export const cleanContentValue = (raw: unknown, max: number = CONTENT_MAX_LEN): string =>
  typeof raw === 'string'
    ? raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max)
    : '';

/** Whitelist keys + clean values. Used when loading from AND saving to the database. */
export const cleanContentMap = (raw: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    const val = cleanContentValue(v, MAX_LEN[k]);
    if (val !== '') out[k] = val;
  }
  return out;
};

/** empty -> built-in text; a single space -> '' (deliberately hidden). */
export const resolveContent = (map: Record<string, string> | undefined, key: string): string => {
  const v = map?.[key];
  return !v ? (FALLBACKS[key] ?? '') : v.trim();
};

/** Fill {rate}-style tokens: formatContent('GST ({rate}%)', { rate: 5 }) */
export const formatContent = (text: string, vars: Record<string, string | number>): string =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), text);
