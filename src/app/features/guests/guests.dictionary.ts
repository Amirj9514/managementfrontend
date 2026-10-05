import type { DictionaryEntry } from '../../core/i18n/translation.service';

/** Guests feature vocabulary — shared by the guest list and guest detail pages. Reuses
 *  COMMON_DICTIONARY keys (common.fullName, common.email, common.cnic, common.dob, etc.)
 *  wherever they already cover a word; only genuinely guests-specific strings live here. */
export const GUESTS_DICTIONARY: Record<string, DictionaryEntry> = {
  'guests.subtitle': { en: 'Search, create, and manage guest profiles.', ur: 'مہمانوں کی پروفائلز تلاش کریں، تخلیق کریں اور ان کا نظم کریں۔' },
  'guests.searchPlaceholder': { en: 'Search by name, email, phone or CNIC', ur: 'نام، ای میل، فون یا شناختی کارڈ سے تلاش کریں' },
  'guests.filter.active': { en: 'Active', ur: 'فعال' },
  'guests.filter.inactive': { en: 'Inactive / deleted', ur: 'غیر فعال / حذف شدہ' },
  'guests.filter.all': { en: 'All', ur: 'تمام' },
  'guests.addGuest': { en: 'Add guest', ur: 'مہمان شامل کریں' },
  'guests.emptyTitle': { en: 'No guests yet', ur: 'ابھی تک کوئی مہمان نہیں' },
  'guests.emptyDescription': { en: 'Create a guest or adjust your search filters.', ur: 'مہمان تخلیق کریں یا اپنی تلاش کی فلٹرز تبدیل کریں۔' },
  'guests.deactivate': { en: 'Deactivate', ur: 'غیر فعال کریں' },
  'guests.editHeader': { en: 'Edit guest', ur: 'مہمان میں ترمیم کریں' },
  'guests.newHeader': { en: 'New guest', ur: 'نیا مہمان' },
  'guests.createGuest': { en: 'Create guest', ur: 'مہمان تخلیق کریں' },
  'guests.profileHeader': { en: 'Guest profile', ur: 'مہمان کی پروفائل' },
  'guests.guestSince': { en: 'Guest since', ur: 'مہمان بننے کی تاریخ' },

  // Toasts
  'guests.toast.created': { en: 'Created', ur: 'تخلیق ہو گیا' },
  'guests.toast.updated': { en: 'Updated', ur: 'اپ ڈیٹ ہو گیا' },
  'guests.toast.saveFailed': { en: 'Save failed', ur: 'محفوظ کرنا ناکام ہوا' },
  'guests.toast.deactivated': { en: 'Deactivated', ur: 'غیر فعال کر دیا گیا' },
  'guests.toast.deactivationFailed': { en: 'Deactivation failed', ur: 'غیر فعال کرنا ناکام ہوا' },
  'guests.toast.restored': { en: 'Restored', ur: 'بحال کر دیا گیا' },
  'guests.toast.restoreFailed': { en: 'Restore failed', ur: 'بحالی ناکام ہوئی' },
  'guests.toast.addNoteFailed': { en: 'Could not add note', ur: 'نوٹ شامل نہیں ہو سکا' },
  'guests.toast.deleteNoteFailed': { en: 'Could not delete note', ur: 'نوٹ حذف نہیں ہو سکا' },

  // Confirm dialogs
  'guests.confirmDeactivateMessage': { en: 'Deactivate {{name}}?', ur: '{{name}} کو غیر فعال کریں؟' },
  'guests.confirmDeactivateHeader': { en: 'Confirm deactivation', ur: 'غیر فعال کرنے کی تصدیق' },
  'guests.confirmDeleteNoteMessage': { en: 'Delete this note? This cannot be undone.', ur: 'کیا یہ نوٹ حذف کریں؟ اسے واپس نہیں کیا جا سکتا۔' },

  // Guest detail page
  'guests.backToGuests': { en: 'Back to guests', ur: 'مہمانین کی طرف واپس' },
  'guests.detailsHeader': { en: 'Guest details', ur: 'مہمان کی تفصیلات' },
  'guests.notesCreation': { en: 'Notes (creation)', ur: 'نوٹس (تخلیق کے وقت)' },
  'guests.tab.previousBookings': { en: 'Previous check-ins', ur: 'سابقہ چیک اِنز' },
  'guests.noBookingsTitle': { en: 'No check-ins yet', ur: 'ابھی تک کوئی چیک اِن نہیں' },
  'guests.noBookingsDescription': { en: "This guest hasn't made any check-ins.", ur: 'اس مہمان نے ابھی تک کوئی چیک اِن نہیں کی۔' },
  'guests.notePlaceholder': { en: 'Log a note about this guest…', ur: 'اس مہمان کے بارے میں ایک نوٹ درج کریں…' },
  'guests.addNote': { en: 'Add note', ur: 'نوٹ شامل کریں' },
  'guests.noNotesYet': { en: 'No notes logged yet.', ur: 'ابھی تک کوئی نوٹ درج نہیں کیا گیا۔' },
  'guests.deleteNote': { en: 'Delete note', ur: 'نوٹ حذف کریں' },
};
