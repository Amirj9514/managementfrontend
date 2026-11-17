import type { DictionaryEntry } from '../../core/i18n/translation.service';

/** Check-in / check-out desk vocabulary. */
export const CHECKOUT_DICTIONARY: Record<string, DictionaryEntry> = {
  'checkout.subtitle': {
    en: 'Every stay you are allowed to see — check guests in when they arrive and out when they leave.',
    ur: 'ہر وہ قیام جو آپ دیکھ سکتے ہیں — مہمانوں کے آنے پر چیک ان اور جانے پر چیک آؤٹ کریں۔',
  },
  'checkout.tab.all': { en: 'All', ur: 'سب' },
  'checkout.tab.cancelled': { en: 'Cancelled', ur: 'منسوخ' },
  'checkout.emptyCancelledTitle': { en: 'No cancelled stays', ur: 'کوئی منسوخ قیام نہیں' },
  'checkout.emptyCancelledDescription': { en: 'Cancelled and no-show stays appear here.', ur: 'منسوخ اور غیر حاضر قیام یہاں نظر آئیں گے۔' },
  'checkout.noCheckInAccess': {
    en: 'You do not have Stays → Check-in access. Ask an admin to enable it.',
    ur: 'آپ کے پاس قیام ← چیک ان کی اجازت نہیں۔ ایڈمن سے فعال کروائیں۔',
  },
  'checkout.noCheckOutAccess': {
    en: 'You do not have Stays → Check-out access. Ask an admin to enable it.',
    ur: 'آپ کے پاس قیام ← چیک آؤٹ کی اجازت نہیں۔ ایڈمن سے فعال کروائیں۔',
  },
  'checkout.tab.checkedOut': { en: 'Checked out', ur: 'چیک آؤٹ شدہ' },
  'checkout.emptyAllTitle': { en: 'No stays', ur: 'کوئی قیام نہیں' },
  'checkout.emptyAllDescription': { en: 'There are no stays to show.', ur: 'دکھانے کے لیے کوئی قیام نہیں ہے۔' },
  'checkout.emptyCheckedOutTitle': { en: 'Nothing checked out yet', ur: 'ابھی کوئی چیک آؤٹ نہیں ہوا' },
  'checkout.emptyCheckedOutDescription': { en: 'Checked-out stays will appear here.', ur: 'چیک آؤٹ شدہ قیام یہاں نظر آئیں گے۔' },
  'checkout.tab.arrivals': { en: 'Awaiting check-in', ur: 'چیک ان کے منتظر' },
  'checkout.searchPlaceholder': { en: 'Search by check-in #', ur: 'چیک اِن نمبر سے تلاش کریں' },
  'checkout.emptyArrivalsTitle': { en: 'No arrivals waiting', ur: 'کوئی آمد منتظر نہیں' },
  'checkout.emptyArrivalsDescription': {
    en: 'There are no reserved rooms or halls waiting to be checked in.',
    ur: 'چیک ان کے منتظر کوئی محفوظ کمرے یا ہالز نہیں ہیں۔',
  },
  'checkout.emptyInHouseTitle': { en: 'Nobody in-house', ur: 'کوئی مقیم نہیں' },
  'checkout.emptyInHouseDescription': {
    en: 'No room or hall is currently checked in.',
    ur: 'اس وقت کوئی کمرہ یا ہال چیک ان نہیں ہے۔',
  },
  'checkout.overdue': { en: 'Overdue', ur: 'مدت گزر گئی' },
  'checkout.checkInAction': { en: 'Check in', ur: 'چیک ان' },
  'checkout.checkOutAction': { en: 'Check out', ur: 'چیک آؤٹ' },
  'checkout.details': { en: 'Details', ur: 'تفصیل' },
  'checkout.confirmOutHeader': { en: 'Confirm check-out', ur: 'چیک آؤٹ کی تصدیق' },
  'checkout.confirmOutMessage': {
    en: 'Check {{guest}} out of {{unit}}?',
    ur: 'کیا {{guest}} کو {{unit}} سے چیک آؤٹ کریں؟',
  },
  'checkout.checkedInToast': { en: '{{unit}} checked in.', ur: '{{unit}} چیک ان ہو گیا۔' },
  'checkout.checkedOutToast': { en: '{{unit}} checked out.', ur: '{{unit}} چیک آؤٹ ہو گیا۔' },
  'checkout.arrivesOn': { en: 'Arrives', ur: 'آمد' },
  'checkout.leavesOn': { en: 'Leaves', ur: 'روانگی' },
};
