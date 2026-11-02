import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const REPORTS_DICTIONARY: Record<string, DictionaryEntry> = {
  'reports.subtitle': { en: 'Occupancy, hall usage, arrivals and departures.', ur: 'قبضہ، ہال کا استعمال، آمد اور روانگی۔' },
  'reports.selectBranch': { en: 'Select branch', ur: 'برانچ منتخب کریں' },
  'reports.selectBranchTitle': { en: 'Select a branch', ur: 'ایک برانچ منتخب کریں' },
  'reports.selectBranchDesc': {
    en: 'Choose a branch to view its reports.',
    ur: 'رپورٹس دیکھنے کے لیے ایک برانچ منتخب کریں۔',
  },

  'reports.view.occupancy': { en: 'Occupancy', ur: 'قبضہ' },
  'reports.view.arrivals': { en: 'Arrivals', ur: 'آمد' },
  'reports.view.departures': { en: 'Departures', ur: 'روانگی' },

  'reports.dateFrom': { en: 'From', ur: 'از' },
  'reports.dateTo': { en: 'To', ur: 'تا' },
  'reports.last7': { en: 'Last 7 days', ur: 'پچھلے 7 دن' },
  'reports.last30': { en: 'Last 30 days', ur: 'پچھلے 30 دن' },
  'reports.last90': { en: 'Last 90 days', ur: 'پچھلے 90 دن' },
  'reports.prevDay': { en: 'Previous', ur: 'پچھلا' },
  'reports.nextDay': { en: 'Next', ur: 'اگلا' },
  'reports.today': { en: 'Today', ur: 'آج' },
  'reports.daysCount': { en: '{{count}} days', ur: '{{count}} دن' },
  'reports.exportCsv': { en: 'Export CSV', ur: 'CSV ایکسپورٹ کریں' },

  'reports.stat.avgOccupancy': { en: 'Avg occupancy', ur: 'اوسط قبضہ' },
  'reports.stat.nightsSold': { en: 'Room nights sold', ur: 'فروخت شدہ کمرہ راتیں' },
  'reports.stat.peak': { en: 'Peak day', ur: 'سب سے مصروف دن' },
  'reports.stat.avgLengthOfStay': { en: 'Avg length of stay', ur: 'اوسط مدتِ قیام' },
  'reports.nights': { en: '{{count}} nights', ur: '{{count}} راتیں' },

  'reports.occupancyTrend': { en: 'Occupancy trend', ur: 'قبضے کا رجحان' },
  'reports.chartLabel': { en: 'Occupancy %', ur: 'قبضے کی شرح %' },

  'reports.hallOccupancy': { en: 'Hall occupancy', ur: 'ہال کا قبضہ' },
  'reports.hallCapacityLabel': { en: 'capacity {{capacity}}', ur: 'گنجائش {{capacity}}' },
  'reports.occupied': { en: 'Occupied', ur: 'مصروف' },
  'reports.remaining': { en: 'Remaining', ur: 'باقی' },
  'reports.noHalls': { en: 'No halls in this branch.', ur: 'اس برانچ میں کوئی ہال نہیں۔' },
  'reports.hallOnlyDays': {
    en: 'Only days when someone stayed are listed — empty days are left out.',
    ur: 'صرف وہی دن دکھائے گئے ہیں جن میں کوئی ٹھہرا — خالی دن شامل نہیں۔',
  },
  'reports.noHallStaysTitle': { en: 'No hall bookings in this period', ur: 'اس مدت میں ہال کی کوئی بکنگ نہیں' },
  'reports.noHallStaysDesc': {
    en: 'No hall had a party between these dates. Try a wider date range.',
    ur: 'ان تاریخوں کے درمیان کسی ہال میں کوئی پارٹی نہیں ہوئی۔ تاریخوں کا دائرہ بڑھائیں۔',
  },
  'reports.exportHalls': { en: 'Export hall usage', ur: 'ہال کا استعمال ایکسپورٹ کریں' },
  'reports.daysUsed': { en: 'days used', ur: 'دن استعمال' },
  'reports.peakGuests': { en: 'peak guests', ur: 'زیادہ سے زیادہ مہمان' },
  'reports.whoStayed': { en: 'Who stayed', ur: 'کون ٹھہرا' },
  'reports.usage': { en: 'Usage', ur: 'استعمال' },
  'reports.partyOf': { en: 'party of {{count}}', ur: '{{count}} افراد کی پارٹی' },
  'hall.audience.gents': { en: 'Gents', ur: 'مرد' },
  'hall.audience.ladies': { en: 'Ladies', ur: 'خواتین' },
  'hall.audience.mixed': { en: 'Mixed', ur: 'مخلوط' },

  'reports.unit': { en: 'Unit', ur: 'یونٹ' },
  'reports.checkIn': { en: 'Check-in', ur: 'چیک ان' },
  'reports.checkOut': { en: 'Checkout', ur: 'چیک آؤٹ' },

  'reports.arrivalsOn': { en: 'Arrivals — {{date}}', ur: 'آمد — {{date}}' },
  'reports.departuresOn': { en: 'Departures — {{date}}', ur: 'روانگی — {{date}}' },
  'reports.lineCount': { en: '{{count}} room(s) / hall(s)', ur: '{{count}} کمرے / ہالز' },
  'reports.todaysArrivals': { en: "Today's arrivals", ur: 'آج کی آمد' },
  'reports.todaysDepartures': { en: "Today's departures", ur: 'آج کی روانگی' },
  'reports.noArrivalsTitle': { en: 'No arrivals', ur: 'کوئی آمد نہیں' },
  'reports.noArrivalsDesc': {
    en: 'No guests are due to check in on this day.',
    ur: 'اس دن کسی مہمان کا چیک ان متوقع نہیں ہے۔',
  },
  'reports.noDeparturesTitle': { en: 'No departures', ur: 'کوئی روانگی نہیں' },
  'reports.noDeparturesDesc': {
    en: 'No guests are due to check out on this day.',
    ur: 'اس دن کسی مہمان کا چیک آؤٹ متوقع نہیں ہے۔',
  },
};
