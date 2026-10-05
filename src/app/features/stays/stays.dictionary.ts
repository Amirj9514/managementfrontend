import type { DictionaryEntry } from '../../core/i18n/translation.service';

/** Stays feature vocabulary — shared by the stay list and stay detail pages. */
export const STAYS_DICTIONARY: Record<string, DictionaryEntry> = {
  'stays.subtitle': { en: 'Reservations and in-house stays.', ur: 'محفوظ شدگی اور مقیم قیام۔' },
  'stays.emptyTitle': { en: 'No stays', ur: 'کوئی قیام نہیں' },
  'stays.emptyDescription': { en: 'No stay records returned.', ur: 'کوئی قیام کا ریکارڈ واپس نہیں آیا۔' },
  'stays.checkIn': { en: 'Check-in', ur: 'چیک ان' },
  'stays.checkOut': { en: 'Check-out', ur: 'چیک آؤٹ' },
  'stays.detailAction': { en: 'Detail', ur: 'تفصیل' },
  'stays.detailTitle': { en: 'Stay', ur: 'قیام' },
};
