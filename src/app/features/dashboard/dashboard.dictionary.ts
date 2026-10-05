import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const DASHBOARD_DICTIONARY: Record<string, DictionaryEntry> = {
  'dashboard.subtitle': {
    en: 'Live overview of occupancy and arrivals.',
    ur: 'قبضے اور آمد کا براہ راست جائزہ۔',
  },
  'dashboard.greeting': {
    en: 'Hello, {{name}} ({{role}})',
    ur: 'ہیلو، {{name}} ({{role}})',
  },
  'dashboard.selectBranch': { en: 'Select branch', ur: 'برانچ منتخب کریں' },
  'dashboard.stat.occupancyToday': { en: 'Occupancy today', ur: 'آج کا قبضہ' },
  'dashboard.stat.checkIns': { en: "Today's check-ins", ur: 'آج کے چیک ان' },
  'dashboard.stat.checkOuts': { en: "Today's check-outs", ur: 'آج کے چیک آؤٹ' },
  'dashboard.stat.availableRooms': { en: 'Available rooms', ur: 'دستیاب کمرے' },
  'dashboard.stat.availableHallCapacity': { en: 'Available hall capacity', ur: 'دستیاب ہال گنجائش' },
  'dashboard.occupancyTrend': { en: 'Occupancy trend (30 days)', ur: 'قبضے کا رجحان (30 دن)' },
  'dashboard.arrivalsToday': { en: 'Arrivals today', ur: 'آج کی آمد' },
  'dashboard.departuresToday': { en: 'Departures today', ur: 'آج کی روانگی' },
  'dashboard.noArrivals': { en: 'No arrivals today.', ur: 'آج کوئی آمد نہیں۔' },
  'dashboard.noDepartures': { en: 'No departures today.', ur: 'آج کوئی روانگی نہیں۔' },
  'dashboard.chartLabel': { en: 'Occupancy %', ur: 'قبضے کی شرح %' },
};
