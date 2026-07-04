/**
 * lib/i18n.ts
 * ─────────────
 * Lightweight storefront UI translation. Covers the storefront "chrome"
 * (buttons, labels, headers) only -- merchant content (product names,
 * descriptions) is never auto-translated. Buyers can override the
 * auto-detected language with a manual switcher.
 */

export type Lang = 'en' | 'fr' | 'ar' | 'tr';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

const AFRICAN_FRENCH_COUNTRIES = new Set(['SN', 'CI', 'ML', 'BF', 'NE', 'TD', 'CM', 'GN', 'TG', 'BJ', 'GA', 'CG', 'CD', 'MG', 'DZ', 'MA', 'TN']);
const ARABIC_COUNTRIES = new Set(['EG', 'SA', 'AE', 'MA', 'DZ', 'TN', 'LY', 'IQ', 'JO', 'LB', 'SY', 'YE', 'OM', 'KW', 'QA', 'BH', 'SD']);
const TURKISH_COUNTRIES = new Set(['TR']);

export function detectLanguageFromCountry(countryCode: string | undefined): Lang {
  if (!countryCode) return 'en';
  if (TURKISH_COUNTRIES.has(countryCode)) return 'tr';
  if (ARABIC_COUNTRIES.has(countryCode)) return 'ar';
  if (AFRICAN_FRENCH_COUNTRIES.has(countryCode)) return 'fr';
  return 'en';
}

type TranslationKey =
  | 'allProducts' | 'all' | 'searchResults' | 'clearSearch'
  | 'addToCart' | 'outOfStock' | 'onlyLeft' | 'itemsLeft' | 'inStock'
  | 'yourCart' | 'cart' | 'checkout' | 'continueShopping' | 'placeOrder'
  | 'total' | 'subtotal' | 'deliveryFee' | 'free' | 'discount'
  | 'fullName' | 'whatsappNumber' | 'orderNote' | 'optional'
  | 'deliveryAddress' | 'provideAddress' | 'sellerWillAsk'
  | 'paymentMethod' | 'payOnDelivery' | 'bankTransfer'
  | 'transferToAccount' | 'bank' | 'accountName' | 'accountNumber' | 'amount'
  | 'uploadReceipt' | 'receiptUploaded' | 'remove'
  | 'orderPlaced' | 'thankYou' | 'chatOnWhatsapp'
  | 'chooseOption' | 'quantity' | 'shareProduct'
  | 'returnPolicy' | 'shippingPolicy' | 'termsOfService'
  | 'welcomeTo' | 'askAnything';

const TRANSLATIONS: Record<Lang, Record<TranslationKey, string>> = {
  en: {
    allProducts: 'All Products', all: 'All', searchResults: 'Search results', clearSearch: 'Clear search',
    addToCart: 'Add to Cart', outOfStock: 'Out of Stock', onlyLeft: 'Only {n} left!', itemsLeft: '{n} left', inStock: 'In stock',
    yourCart: 'Your Cart', cart: 'Cart', checkout: 'Checkout', continueShopping: 'Continue browsing', placeOrder: 'Place Order',
    total: 'Total', subtotal: 'Subtotal', deliveryFee: 'Delivery fee', free: 'Free!', discount: 'Discount',
    fullName: 'Full name', whatsappNumber: 'WhatsApp number', orderNote: 'Order note', optional: 'optional',
    deliveryAddress: 'Delivery address', provideAddress: 'Add delivery address', sellerWillAsk: 'Seller will ask on WhatsApp',
    paymentMethod: 'Payment Method', payOnDelivery: 'Pay on Delivery', bankTransfer: 'Bank Transfer',
    transferToAccount: 'Transfer to this account', bank: 'Bank', accountName: 'Account Name', accountNumber: 'Account Number', amount: 'Amount',
    uploadReceipt: 'Upload transfer receipt', receiptUploaded: 'Receipt uploaded', remove: 'Remove',
    orderPlaced: 'Order Placed!', thankYou: 'Thank you for your order', chatOnWhatsapp: 'Chat on WhatsApp',
    chooseOption: 'Choose an option', quantity: 'Quantity', shareProduct: 'Share',
    returnPolicy: 'Return Policy', shippingPolicy: 'Shipping Policy', termsOfService: 'Terms of Service',
    welcomeTo: 'Welcome to', askAnything: 'Ask about products, sizes, delivery...',
  },
  fr: {
    allProducts: 'Tous les produits', all: 'Tout', searchResults: 'Résultats de recherche', clearSearch: 'Effacer la recherche',
    addToCart: 'Ajouter au panier', outOfStock: 'Rupture de stock', onlyLeft: 'Plus que {n}!', itemsLeft: '{n} restants', inStock: 'En stock',
    yourCart: 'Votre panier', cart: 'Panier', checkout: 'Commander', continueShopping: 'Continuer les achats', placeOrder: 'Passer la commande',
    total: 'Total', subtotal: 'Sous-total', deliveryFee: 'Frais de livraison', free: 'Gratuit!', discount: 'Réduction',
    fullName: 'Nom complet', whatsappNumber: 'Numéro WhatsApp', orderNote: 'Note de commande', optional: 'optionnel',
    deliveryAddress: 'Adresse de livraison', provideAddress: 'Ajouter une adresse', sellerWillAsk: 'Le vendeur demandera sur WhatsApp',
    paymentMethod: 'Mode de paiement', payOnDelivery: 'Paiement à la livraison', bankTransfer: 'Virement bancaire',
    transferToAccount: 'Virer sur ce compte', bank: 'Banque', accountName: 'Nom du compte', accountNumber: 'Numéro de compte', amount: 'Montant',
    uploadReceipt: 'Télécharger le reçu', receiptUploaded: 'Reçu téléchargé', remove: 'Retirer',
    orderPlaced: 'Commande passée!', thankYou: 'Merci pour votre commande', chatOnWhatsapp: 'Discuter sur WhatsApp',
    chooseOption: 'Choisir une option', quantity: 'Quantité', shareProduct: 'Partager',
    returnPolicy: 'Politique de retour', shippingPolicy: 'Politique de livraison', termsOfService: "Conditions d'utilisation",
    welcomeTo: 'Bienvenue chez', askAnything: 'Posez des questions sur les produits, tailles, livraison...',
  },
  ar: {
    allProducts: 'كل المنتجات', all: 'الكل', searchResults: 'نتائج البحث', clearSearch: 'مسح البحث',
    addToCart: 'أضف إلى السلة', outOfStock: 'نفذت الكمية', onlyLeft: 'بقي {n} فقط!', itemsLeft: 'متبقي {n}', inStock: 'متوفر',
    yourCart: 'سلتك', cart: 'السلة', checkout: 'الدفع', continueShopping: 'مواصلة التسوق', placeOrder: 'إرسال الطلب',
    total: 'المجموع', subtotal: 'المجموع الفرعي', deliveryFee: 'رسوم التوصيل', free: 'مجاني!', discount: 'خصم',
    fullName: 'الاسم الكامل', whatsappNumber: 'رقم واتساب', orderNote: 'ملاحظة الطلب', optional: 'اختياري',
    deliveryAddress: 'عنوان التوصيل', provideAddress: 'إضافة عنوان التوصيل', sellerWillAsk: 'سيسأل البائع عبر واتساب',
    paymentMethod: 'طريقة الدفع', payOnDelivery: 'الدفع عند الاستلام', bankTransfer: 'تحويل بنكي',
    transferToAccount: 'حوّل إلى هذا الحساب', bank: 'البنك', accountName: 'اسم الحساب', accountNumber: 'رقم الحساب', amount: 'المبلغ',
    uploadReceipt: 'ارفع إيصال التحويل', receiptUploaded: 'تم رفع الإيصال', remove: 'إزالة',
    orderPlaced: 'تم إرسال الطلب!', thankYou: 'شكراً لطلبك', chatOnWhatsapp: 'تحدث عبر واتساب',
    chooseOption: 'اختر خياراً', quantity: 'الكمية', shareProduct: 'مشاركة',
    returnPolicy: 'سياسة الإرجاع', shippingPolicy: 'سياسة الشحن', termsOfService: 'الشروط والأحكام',
    welcomeTo: 'مرحباً بكم في', askAnything: 'اسأل عن المنتجات، المقاسات، التوصيل...',
  },
  tr: {
    allProducts: 'Tüm Ürünler', all: 'Tümü', searchResults: 'Arama sonuçları', clearSearch: 'Aramayı temizle',
    addToCart: 'Sepete Ekle', outOfStock: 'Stokta Yok', onlyLeft: 'Sadece {n} kaldı!', itemsLeft: '{n} kaldı', inStock: 'Stokta var',
    yourCart: 'Sepetiniz', cart: 'Sepet', checkout: 'Ödeme', continueShopping: 'Alışverişe devam et', placeOrder: 'Siparişi Ver',
    total: 'Toplam', subtotal: 'Ara toplam', deliveryFee: 'Teslimat ücreti', free: 'Ücretsiz!', discount: 'İndirim',
    fullName: 'Ad Soyad', whatsappNumber: 'WhatsApp numarası', orderNote: 'Sipariş notu', optional: 'opsiyonel',
    deliveryAddress: 'Teslimat adresi', provideAddress: 'Teslimat adresi ekle', sellerWillAsk: 'Satıcı WhatsApp\'tan soracak',
    paymentMethod: 'Ödeme Yöntemi', payOnDelivery: 'Kapıda Ödeme', bankTransfer: 'Banka Havalesi',
    transferToAccount: 'Bu hesaba transfer edin', bank: 'Banka', accountName: 'Hesap Adı', accountNumber: 'Hesap Numarası', amount: 'Tutar',
    uploadReceipt: 'Dekont yükle', receiptUploaded: 'Dekont yüklendi', remove: 'Kaldır',
    orderPlaced: 'Sipariş Verildi!', thankYou: 'Siparişiniz için teşekkürler', chatOnWhatsapp: "WhatsApp'tan yazın",
    chooseOption: 'Bir seçenek seçin', quantity: 'Adet', shareProduct: 'Paylaş',
    returnPolicy: 'İade Politikası', shippingPolicy: 'Teslimat Politikası', termsOfService: 'Kullanım Şartları',
    welcomeTo: "Hoş geldiniz", askAnything: 'Ürünler, bedenler, teslimat hakkında sorun...',
  },
};

export function t(lang: Lang, key: TranslationKey, params?: Record<string, string | number>): string {
  let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key];
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
  }
  return str;
}
