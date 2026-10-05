import type { DictionaryEntry } from '../../core/i18n/translation.service';

/** Guest-picker vocabulary — this component is shared by the booking wizard and hall
 *  quick check-in, so it ships its own strings rather than depending on the guests
 *  feature's dictionary having been registered yet. */
export const GUEST_PICKER_DICTIONARY: Record<string, DictionaryEntry> = {
  'guestPicker.searchPlaceholder': {
    en: 'Search by phone, CNIC or passport number',
    ur: 'فون، شناختی کارڈ یا پاسپورٹ نمبر سے تلاش کریں',
  },
  'guestPicker.identityOnlyHint': {
    en: 'Guests can\'t be searched by name — enter their phone, CNIC or passport number.',
    ur: 'مہمان کو نام سے تلاش نہیں کیا جا سکتا — فون، شناختی کارڈ یا پاسپورٹ نمبر درج کریں۔',
  },
  'guestPicker.noMatchingGuests': { en: 'No matching guests', ur: 'کوئی مماثل مہمان نہیں ملا' },
  'guestPicker.newGuest': { en: 'New guest', ur: 'نیا مہمان' },
  'guestPicker.noMatchFor': { en: 'No guest matches “{{query}}”.', ur: '“{{query}}” سے کوئی مہمان مماثل نہیں ہے۔' },
  'guestPicker.addAsNewGuest': { en: 'Add as new guest', ur: 'نئے مہمان کے طور پر شامل کریں' },
  'guestPicker.lastBooking': { en: 'Last check-in', ur: 'آخری چیک اِن' },
  'guestPicker.totalCount': { en: '{{count}} total', ur: 'کل {{count}}' },
  'guestPicker.noPreviousBookings': { en: 'No previous check-ins.', ur: 'کوئی سابقہ چیک اِن نہیں۔' },
  'guestPicker.lastNote': { en: 'Last note', ur: 'آخری نوٹ' },
  'guestPicker.noNotesLogged': { en: 'No notes logged.', ur: 'کوئی نوٹ درج نہیں ہے۔' },
  'guestPicker.viewAllDetails': { en: 'View all details', ur: 'تمام تفصیلات دیکھیں' },
  'guestPicker.createGuest': { en: 'Create guest', ur: 'مہمان تخلیق کریں' },
  'guestPicker.createGuestFailed': { en: 'Could not create guest', ur: 'مہمان تخلیق نہیں ہو سکا' },
};
