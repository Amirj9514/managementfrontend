import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const AMENITIES_DICTIONARY: Record<string, DictionaryEntry> = {
  'amenities.subtitle': {
    en: 'The facilities your rooms and halls offer — add them once, then tick them on each room or hall.',
    ur: 'آپ کے کمروں اور ہالز میں دستیاب سہولیات — ایک بار شامل کریں، پھر ہر کمرے یا ہال پر منتخب کریں۔',
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
  'amenities.confirmRemove': { en: 'Remove amenity "{{name}}"? This cannot be undone.', ur: 'سہولت "{{name}}" ہٹائیں؟ یہ عمل واپس نہیں ہو سکتا۔' },
  'amenities.removed': { en: 'Removed', ur: 'ہٹا دیا گیا' },
  'amenities.removalFailed': { en: 'Removal failed', ur: 'ہٹانے میں ناکامی' },

  // List: stats, filters, cards
  'amenities.stat.total': { en: 'Total', ur: 'کل' },
  'amenities.stat.unused': { en: 'Not used yet', ur: 'ابھی استعمال میں نہیں' },
  'amenities.searchPlaceholder': { en: 'Search amenities or categories', ur: 'سہولت یا زمرہ تلاش کریں' },
  'amenities.filter.all': { en: 'All', ur: 'سب' },
  'amenities.allCategories': { en: 'All categories', ur: 'تمام زمرے' },
  'amenities.clearFilters': { en: 'Clear filters', ur: 'فلٹر ہٹائیں' },
  'amenities.view.grid': { en: 'Card view', ur: 'کارڈ ویو' },
  'amenities.view.list': { en: 'Table view', ur: 'ٹیبل ویو' },
  'amenities.uncategorised': { en: 'No category', ur: 'کوئی زمرہ نہیں' },
  'amenities.scope': { en: 'Available in', ur: 'دستیاب ہے' },
  'amenities.allBranches': { en: 'All branches', ur: 'تمام برانچیں' },
  'amenities.thisBranch': { en: 'One branch', ur: 'ایک برانچ' },
  'amenities.usedIn': { en: 'Used in', ur: 'استعمال' },
  'amenities.unused': { en: 'Not used yet', ur: 'ابھی استعمال میں نہیں' },
  'amenities.usedRoom': { en: '1 room', ur: '1 کمرہ' },
  'amenities.usedHall': { en: '1 hall', ur: '1 ہال' },
  'amenities.usedRooms': { en: '{{n}} rooms', ur: '{{n}} کمرے' },
  'amenities.usedHalls': { en: '{{n}} halls', ur: '{{n}} ہال' },
  'amenities.noMatch.title': { en: 'No amenity matches', ur: 'کوئی سہولت نہیں ملی' },
  'amenities.noMatch.description': { en: 'Try a different search or clear the filters.', ur: 'کوئی اور تلاش آزمائیں یا فلٹر ہٹا دیں۔' },
  'amenities.quickAdd': { en: 'Quick add', ur: 'فوری شامل کریں' },

  // Add / edit dialog
  'amenities.previewName': { en: 'Amenity name', ur: 'سہولت کا نام' },
  'amenities.scopeHint': {
    en: 'Shared amenities can be ticked on rooms and halls of every branch; a branch amenity only shows in that branch.',
    ur: 'مشترکہ سہولت ہر برانچ کے کمروں اور ہالز پر منتخب ہو سکتی ہے؛ برانچ کی سہولت صرف اسی برانچ میں نظر آتی ہے۔',
  },
  'amenities.activeHint': {
    en: 'Inactive amenities stay on existing rooms but cannot be picked for new ones.',
    ur: 'غیر فعال سہولتیں موجودہ کمروں پر رہتی ہیں مگر نئے کمروں کے لیے منتخب نہیں ہو سکتیں۔',
  },
  'amenities.confirmRemoveUsed': {
    en: '"{{name}}" is used in {{usage}}. Removing it takes it off all of them. Remove anyway? (Switch it to inactive instead to keep it on existing rooms.)',
    ur: '"{{name}}" {{usage}} میں استعمال ہو رہی ہے۔ ہٹانے سے یہ سب سے ہٹ جائے گی۔ پھر بھی ہٹائیں؟ (موجودہ کمروں پر رکھنے کے لیے اسے غیر فعال کر دیں۔)',
  },
};
