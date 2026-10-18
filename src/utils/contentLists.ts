/**
 * Control-Panel-editable CARD LISTS (articles / questions) for the
 * Gayatri Secrets and Curiosity pages.
 *
 *  - not saved yet          -> the built-in cards (site looks exactly as before)
 *  - saved list with cards  -> those cards, in that order
 *  - saved EMPTY list       -> that section is hidden (admin deleted every card)
 *
 * Safety: only the keys below are read; every card is cleaned (plain text,
 * control characters removed, length and card-count capped) both when loading
 * from the database and before saving. Text is shown through React text nodes,
 * and the only formatting allowed is **bold**, turned into <strong> by
 * RichText (never raw HTML).
 */
export interface ContentCard { title: string; body: string }

export interface ContentListDef {
  key: string;
  label: string;
  help: string;
  itemName: string;
  maxItems: number;
  defaults: ContentCard[];
}

export const CARD_TITLE_MAX = 200;
export const CARD_BODY_MAX = 1500;

export const CONTENT_LISTS: ContentListDef[] = [
  {
    key: 'gayatriArticles',
    label: 'गायत्री रहस्य पेज: लेख (Articles)',
    help: 'हर कार्ड = एक लेख। मोटे अक्षरों के लिए शब्द को **इस तरह** लिखें।',
    itemName: 'लेख',
    maxItems: 12,
    defaults: [
      { title: '1. मंत्र का मुख्य रहस्य (ॐ भूर्भुवः स्वः)', body: 'इस संपूर्ण ब्रह्मांड में यदि कोई ऐसी ध्वनि है जो मनुष्य की चेतना को सीधे ईश्वर से जोड़ सकती है, तो वह है **"ॐ भूर्भुवः स्वः"**। वेदों की ऋचाओं से लेकर आधुनिक विज्ञान की खोजों तक, गायत्री मंत्र केवल एक प्रार्थना नहीं बल्कि ब्रह्मांडीय ऊर्जा को जाग्रत करने की एक अमोघ कुंजी है। लोग इसे केवल एक धार्मिक मंत्र मानते हैं, परन्तु इसका रहस्य बहुत गहरा है।' },
      { title: '2. 24 देवशक्तियों का दिव्य रूप', body: 'गायत्री मंत्र के 24 अक्षर केवल शब्द नहीं हैं, ये मानव शरीर की **24 ग्रंथियों और 24 सिद्धि-शक्तियों** को जाग्रत करने वाली सूक्ष्म ध्वनि-तरंगें हैं। जब हम इन 24 अक्षरों का सही उच्चारण और ध्यान करते हैं, तो शरीर के 24 मुख्य ऊर्जा केंद्र जाग्रत होने लगते हैं, जिससे जीवन में चमत्कारिक परिवर्तन होता है।' },
      { title: '3. सद्बुद्धि की अमोघ प्रार्थना', body: 'दुनिया के अधिकांश लोग प्रार्थना में ईश्वर से धन, आरोग्य या मुक्ति मांगते हैं, लेकिन गायत्री मंत्र ईश्वर से केवल एक ही चीज़ मांगती है—**सद्बुद्धि (धियो यो नः प्रचोदयात्)**। जब बुद्धि शुद्ध, स्थिर और प्रखर होगी, तो जीवन का हर सुख, सफलता और परम शांति स्वतः ही आपके कदम चूमेगी।' },
      { title: '4. अमर जल और अलौकिक तेज', body: 'शरीर को स्वच्छ रखने के लिए जल की आवश्यकता होती है, और आत्मा तथा बुद्धि को निर्मल रखने के लिए **गायत्री महामंत्र के अमर जल** की। जो साधक नियम से गायत्री मंत्र का प्रामाणिक जप करता है, उसके चेहरे पर एक दिव्य आभा और अलौकिक ओजस्वी तेज स्पष्ट दिखाई देने लगता है।' },
      { title: '5. दुर्गा सप्तशती और अंतयात्रा का गूढ़ संबंध', body: 'गायत्री महामंत्र का आध्यात्मिक महत्व और दुर्गा सप्तशती का अंतयात्रा से गहरा सीधा संबंध है। दुर्गा सप्तशती के 13 अध्याय वास्तव में मनुष्य के भीतर छिपे 13 दुर्गुणों (महिषासुर, शुम्भ-निशुम्भ आदि) के संहार और नौ देवशक्तियों के जागरण की आभ्यंतर गाथा हैं। जब दुर्गा की आद्याशक्ति और गायत्री की ब्रह्मचेतना मिलती है, तब साधक की अंतयात्रा पूर्ण होती है और परम शांति प्राप्त होती है।' },
    ],
  },
  {
    key: 'curiosityQuestions',
    label: 'जिज्ञासा पेज: सवाल-जवाब कार्ड',
    help: 'शीर्षक = सवाल, विवरण = जवाब। पहला कार्ड शुरू में चुना हुआ दिखता है।',
    itemName: 'सवाल',
    maxItems: 6,
    defaults: [
      { title: 'क्या आपने कभी सोचा है कि वर्षों तक मंत्र जाप के बाद भी मन को (या मन-चंचल और अशांत) शांति क्यों नहीं मिलती?', body: 'अधिकांश साधक मंत्रों का केवल मौखिक या बाह्य उच्चारण करते हैं, जबकि मंत्र का वास्तविक सामर्थ्य उसके अंतर्मन में छिपे ध्वनि-स्पंदन (Sound Resonance) और भाव-चेतना में होता है। जब तक मंत्र जाप को केवल एक नियम मानकर किया जाता है, तब तक मन की चंचलता बनी रहती है। "शक्ति से शांति" ग्रंथ में गायत्री एवं दुर्गा मंत्र के उस आंतरिक संयोजन को उजागर किया गया है जो बाह्य जाप से आगे सीधे अंतर्मन को स्थिर कर परम शांति प्रदान करता है।' },
      { title: 'क्या मंत्र सिर्फ शब्द है या किसी गुप्त ऊर्जा द्वार को खोलने की सूक्ष्म चाबी?', body: 'मंत्र मात्र अक्षरों का समूह नहीं, बल्कि ब्रह्मांडीय ऊर्जा तरंगों का गणितीय एवं सूक्ष्म संयोजन है। जैसे सही पासवर्ड ही तिजोरी को खोल सकता है, वैसे ही गायत्री और दुर्गा मंत्र की सटीक उच्चारण आवृत्ति (Frequency) और भावना ही अंतर्मन के 24 ऊर्जा केंद्रों को जाग्रत करती है। यह ग्रंथ आपको उस गुप्त कुंजी का बोध कराता है जो आपके भीतर सोई हुई दिव्य शक्तियों के द्वार खोल देती है।' },
      { title: 'शक्ति से शांति तक की अंतयात्रा का असली मार्ग क्या है?', body: 'शक्ति (ऊर्जा और सामर्थ्य) प्राप्त करना पहला चरण है, परन्तु यदि वह शक्ति शांति में रूपांतरित न हो तो वह अशांति का कारण बन जाती है। दुर्गा मंत्र की उग्र शक्ति को गायत्री मंत्र की शुद्ध बुद्धिमत्ता के साथ साधना ही शक्ति से शांति तक पहुँचने का एकमात्र प्रामाणिक वैदिक मार्ग है। इस ग्रंथ में चरणबद्ध विधि से अंतयात्रा की पूरी कुंजी दी गई है।' },
    ],
  },
  {
    key: 'curiosityConcepts',
    label: 'जिज्ञासा पेज: तीन गहरे बिंदु (नीचे का गहरा बॉक्स)',
    help: 'हर कार्ड = एक बिंदु (शीर्षक + विवरण)।',
    itemName: 'बिंदु',
    maxItems: 6,
    defaults: [
      { title: 'भौतिक सफलता और शांति का विरोधाभास', body: 'भौतिक सफलता और शक्ति पाने के बाद भी परम शांति का अनुभव क्यों अधूरा रह जाता है? इस ग्रंथ के पन्नों में ऐसा क्या छिपा है जो आपकी आंतरिक ऊर्जा का दृष्टिकोण बदल देगा? जब तक बाह्य सफलता आंतरिक चेतना से नहीं जुड़ती, तब तक मन अतृप्त रहता है।' },
      { title: 'वैज्ञानिक एवं मानसिक बदलाव (Alpha Waves)', body: 'आधुनिक विज्ञान ने भी स्वीकार किया है कि गायत्री मंत्र का निरंतर जप करने से मस्तिष्क से अल्फा (Alpha) तरंगें उत्पन्न होती हैं, जो तनाव को मिटाकर सही समय पर सही निर्णय लेने की शक्ति और एकाग्रता को कई गुना बढ़ा देती हैं।' },
      { title: 'अभेद्य सुरक्षा कवच (Divine Aura)', body: 'जब गायत्री और दुर्गा मंत्र की साधना विधिपूर्वक सिद्ध होती है, तो आपके चारों ओर एक ऐसा सुरक्षा कवच बन जाता है जिससे नकारात्मक विचार, चिंताएं या बुरी शक्तियां आपको स्पर्श भी नहीं कर पातीं।' },
    ],
  },
];

const DEFS = new Map(CONTENT_LISTS.map(d => [d.key, d]));
const strip = (s: unknown, max: number) =>
  typeof s === 'string' ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max) : '';

/** Whitelist list keys, cap card counts, clean every card. Used on load AND on save. */
export const cleanContentLists = (raw: unknown): Record<string, ContentCard[]> => {
  const out: Record<string, ContentCard[]> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const def = DEFS.get(key);
    if (!def || !Array.isArray(val)) continue;
    out[key] = val
      .slice(0, def.maxItems)
      .map(c => ({ title: strip((c as any)?.title, CARD_TITLE_MAX).trim(), body: strip((c as any)?.body, CARD_BODY_MAX).trim() }))
      .filter(c => c.title !== '' || c.body !== '');
  }
  return out;
};

export const resolveContentList = (lists: Record<string, ContentCard[]> | undefined, key: string): ContentCard[] => {
  const saved = lists?.[key];
  return saved !== undefined ? saved : (DEFS.get(key)?.defaults ?? []);
};
