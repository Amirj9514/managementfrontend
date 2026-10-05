import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const REPORTS_DICTIONARY: Record<string, DictionaryEntry> = {
  'reports.subtitle': { en: 'Occupancy and arrivals/departures.', ur: 'قبضہ اور آمد/روانگی۔' },
  'reports.selectBranch': { en: 'Select branch', ur: 'برانچ منتخب کریں' },
  'reports.selectBranchTitle': { en: 'Select a branch', ur: 'ایک برانچ منتخب کریں' },
  'reports.selectBranchDesc': {
    en: 'Choose a branch to view its reports.',
    ur: 'رپورٹس دیکھنے کے لیے ایک برانچ منتخب کریں۔',
  },

  'reports.view.occupancy': { en: 'Occupancy', ur: 'قبضہ' },
  'reports.view.arrivals': { en: 'Arrivals', ur: 'آمد' },
  'reports.view.departures': { en: 'Departures', ur: 'روانگی' },

  'reports.dateTo': { en: 'to', ur: 'تا' },
  'reports.exportCsv': { en: 'Export CSV', ur: 'CSV ایکسپورٹ کریں' },

  'reports.stat.avgOccupancy': { en: 'Avg occupancy', ur: 'اوسط قبضہ' },
  'reports.stat.avgLengthOfStay': { en: 'Avg length of stay', ur: 'اوسط مدتِ قیام' },
  'reports.nights': { en: '{{count}} nights', ur: '{{count}} راتیں' },

  'reports.occupancyTrend': { en: 'Occupancy trend', ur: 'قبضے کا رجحان' },
  'reports.chartLabel': { en: 'Occupancy %', ur: 'قبضے کی شرح %' },

  'reports.hallOccupancy': { en: 'Hall occupancy', ur: 'ہال کا قبضہ' },
  'reports.hallCapacityLabel': { en: 'capacity {{capacity}}', ur: 'گنجائش {{capacity}}' },
  'reports.occupied': { en: 'Occupied', ur: 'مصروف' },
  'reports.remaining': { en: 'Remaining', ur: 'باقی' },
  'reports.noHalls': { en: 'No halls in this branch.', ur: 'اس برانچ میں کوئی ہال نہیں۔' },

  'reports.unit': { en: 'Unit', ur: 'یونٹ' },
  'reports.checkIn': { en: 'Check-in', ur: 'چیک ان' },
  'reports.checkOut': { en: 'Checkout', ur: 'چیک آؤٹ' },

  'reports.todaysArrivals': { en: "Today's arrivals", ur: 'آج کی آمد' },
  'reports.todaysDepartures': { en: "Today's departures", ur: 'آج کی روانگی' },
  'reports.noArrivalsTitle': { en: 'No arrivals', ur: 'کوئی آمد نہیں' },
  'reports.noArrivalsDesc': {
    en: 'No guests are due to check in today.',
    ur: 'آج کسی مہمان کا چیک ان متوقع نہیں ہے۔',
  },
  'reports.noDeparturesTitle': { en: 'No departures', ur: 'کوئی روانگی نہیں' },
  'reports.noDeparturesDesc': {
    en: 'No guests are due to check out today.',
    ur: 'آج کسی مہمان کا چیک آؤٹ متوقع نہیں ہے۔',
  },
};
