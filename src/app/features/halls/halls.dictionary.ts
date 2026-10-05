import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const HALLS_DICTIONARY: Record<string, DictionaryEntry> = {
  'halls.subtitle': {
    en: 'Shared accommodation — track live capacity and manage group check-in/check-out.',
    ur: 'مشترکہ رہائش — براہ راست گنجائش دیکھیں اور گروپ چیک ان/چیک آؤٹ کا انتظام کریں۔',
  },
  'halls.selectBranch': { en: 'Select branch', ur: 'برانچ منتخب کریں' },
  'halls.newHall': { en: 'New hall', ur: 'نیا ہال' },

  'halls.emptyBranch.title': { en: 'Select a branch to get started', ur: 'شروع کرنے کے لیے برانچ منتخب کریں' },
  'halls.emptyBranch.description': { en: 'Choose a branch above to see its halls.', ur: 'اس کے ہال دیکھنے کے لیے اوپر برانچ منتخب کریں۔' },
  'halls.emptyHalls.title': { en: 'No halls found', ur: 'کوئی ہال نہیں ملا' },
  'halls.emptyHalls.description': {
    en: 'Add a public hall / dormitory to this floor.',
    ur: 'اس منزل میں ایک عوامی ہال / ڈورمیٹری شامل کریں۔',
  },

  'halls.groupCheckIn': { en: 'Group check-in', ur: 'گروپ چیک ان' },
  'halls.liveOccupancy': { en: 'Live occupancy', ur: 'براہ راست قبضہ' },
  'halls.currentParties': { en: 'Current parties', ur: 'موجودہ گروہ' },
  'halls.noCurrentParties': { en: 'No one currently checked in.', ur: 'فی الحال کوئی چیک ان نہیں ہے۔' },
  'halls.upcomingReservations': { en: 'Upcoming reservations', ur: 'آئندہ محفوظ شدگی' },
  'halls.noUpcomingReservations': { en: 'No upcoming reservations.', ur: 'کوئی آئندہ محفوظ شدگی نہیں۔' },
  'halls.partySize': { en: 'Party size', ur: 'گروہ کا حجم' },
  'halls.checkedInAt': { en: 'Checked in', ur: 'چیک ان وقت' },
  'halls.expectedCheckout': { en: 'Expected checkout', ur: 'متوقع چیک آؤٹ' },
  'halls.arrival': { en: 'Arrival', ur: 'آمد' },
  'halls.departure': { en: 'Departure', ur: 'روانگی' },
  'halls.checkOut': { en: 'Check out', ur: 'چیک آؤٹ کریں' },
  'halls.checkIn': { en: 'Check in', ur: 'چیک ان کریں' },

  'halls.formHeaderNew': { en: 'New hall', ur: 'نیا ہال' },
  'halls.formHeaderEdit': { en: 'Edit hall', ur: 'ہال میں ترمیم کریں' },
  'halls.hallNameCode': { en: 'Hall name / code', ur: 'ہال کا نام / کوڈ' },
  'halls.hallNamePlaceholder': { en: 'e.g. Dormitory A', ur: 'مثال کے طور پر ڈورمیٹری اے' },
  'halls.maxCapacity': { en: 'Max capacity', ur: 'زیادہ سے زیادہ گنجائش' },
  'halls.selectAmenities': { en: 'Select amenities', ur: 'سہولیات منتخب کریں' },
  'halls.createHall': { en: 'Create hall', ur: 'ہال تخلیق کریں' },

  'halls.groupCheckInHeader': { en: 'Group check-in', ur: 'گروپ چیک ان' },
  'halls.primaryGuest': { en: 'Primary guest', ur: 'بنیادی مہمان' },
  'halls.notesOptional': { en: 'Notes (optional)', ur: 'نوٹس (اختیاری)' },

  // Toasts / confirm dialogs
  'halls.saveFailed': { en: 'Save failed', ur: 'محفوظ کرنے میں ناکامی' },
  'halls.confirmDeactivateHeader': { en: 'Confirm deactivation', ur: 'غیر فعال کرنے کی تصدیق' },
  'halls.confirmDeactivate': { en: 'Deactivate hall "{{code}}"?', ur: 'ہال "{{code}}" غیر فعال کریں؟' },
  'halls.deactivationFailed': { en: 'Deactivation failed', ur: 'غیر فعال کرنے میں ناکامی' },
  'halls.guestRequired': { en: 'Guest required', ur: 'مہمان درکار ہے' },
  'halls.guestRequiredDetail': { en: 'Search or create a guest first.', ur: 'پہلے مہمان تلاش کریں یا بنائیں۔' },
  'halls.checkInFailed': { en: 'Check-in failed', ur: 'چیک ان ناکام ہو گیا' },
  'halls.checkedInSummary': { en: 'Checked in', ur: 'چیک ان ہو گیا' },
  'halls.checkedInDetail': { en: 'Party of {{size}} checked in to {{code}}', ur: '{{size}} افراد کا گروہ {{code}} میں چیک ان ہو گیا' },
  'halls.confirmCheckOutHeader': { en: 'Confirm check-out', ur: 'چیک آؤٹ کی تصدیق' },
  'halls.confirmCheckOut': { en: 'Check out this party of {{size}}?', ur: '{{size}} افراد کے اس گروہ کو چیک آؤٹ کریں؟' },
  'halls.checkedOutSummary': { en: 'Checked out', ur: 'چیک آؤٹ ہو گیا' },
  'halls.checkedOutDetail': { en: 'Capacity freed up.', ur: 'گنجائش خالی کر دی گئی۔' },
  'halls.checkOutFailed': { en: 'Check-out failed', ur: 'چیک آؤٹ ناکام ہو گیا' },
};
