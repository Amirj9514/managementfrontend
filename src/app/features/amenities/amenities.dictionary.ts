import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const AMENITIES_DICTIONARY: Record<string, DictionaryEntry> = {
  'amenities.subtitle': {
    en: 'Manage the amenity catalog used by room and hall listings.',
    ur: 'کمرے اور ہال کی فہرستوں میں استعمال ہونے والی سہولیات کی فہرست کا انتظام کریں۔',
  },
  'amenities.newAmenity': { en: 'New amenity', ur: 'نئی سہولت' },
  'amenities.empty.title': { en: 'No amenities yet', ur: 'ابھی تک کوئی سہولت نہیں' },
  'amenities.empty.description': {
    en: 'Add amenities like Wi-Fi, AC, or a private bathroom.',
    ur: 'وائی فائی، اے سی، یا نجی باتھ روم جیسی سہولیات شامل کریں۔',
  },
  'amenities.category': { en: 'Category', ur: 'زمرہ' },
  'amenities.formHeaderNew': { en: 'New amenity', ur: 'نئی سہولت' },
  'amenities.formHeaderEdit': { en: 'Edit amenity', ur: 'سہولت میں ترمیم کریں' },
  'amenities.namePlaceholder': { en: 'e.g. Free Wi-Fi', ur: 'مثال کے طور پر مفت وائی فائی' },
  'amenities.icon': { en: 'Icon (optional)', ur: 'آئیکن (اختیاری)' },
  'amenities.categoryOptional': { en: 'Category (optional)', ur: 'زمرہ (اختیاری)' },
  'amenities.categoryPlaceholder': { en: 'e.g. Connectivity', ur: 'مثال کے طور پر رابطہ کاری' },
  'amenities.createAmenity': { en: 'Create amenity', ur: 'سہولت تخلیق کریں' },

  // Toasts / confirm dialogs
  'amenities.saveFailed': { en: 'Save failed', ur: 'محفوظ کرنے میں ناکامی' },
  'amenities.confirmRemoveHeader': { en: 'Confirm removal', ur: 'ہٹانے کی تصدیق' },
  'amenities.confirmRemove': { en: 'Remove amenity "{{name}}"?', ur: 'سہولت "{{name}}" ہٹائیں؟' },
  'amenities.removed': { en: 'Removed', ur: 'ہٹا دیا گیا' },
  'amenities.removalFailed': { en: 'Removal failed', ur: 'ہٹانے میں ناکامی' },
};
