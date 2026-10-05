import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const FORBIDDEN_DICTIONARY: Record<string, DictionaryEntry> = {
  'forbidden.title': { en: 'Access restricted', ur: 'رسائی محدود ہے' },
  'forbidden.message': {
    en: 'You do not have permission to view this page or your branch scope does not allow this action.',
    ur: 'آپ کو یہ صفحہ دیکھنے کی اجازت نہیں ہے یا آپ کی برانچ کی حد اس عمل کی اجازت نہیں دیتی۔',
  },
  'forbidden.backToDashboard': { en: 'Back to dashboard', ur: 'ڈیش بورڈ پر واپس جائیں' },
};
