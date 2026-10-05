import type { DictionaryEntry } from '../translation.service';

/** Sidebar nav groups/items and the matching breadcrumb trail — kept together since
 *  breadcrumb labels for top-level pages are exactly the nav item labels. */
export const NAV_DICTIONARY: Record<string, DictionaryEntry> = {
  'nav.group.overview': { en: 'Overview', ur: 'جائزہ' },
  'nav.group.operations': { en: 'Operations', ur: 'کارروائیاں' },
  'nav.group.property': { en: 'Property', ur: 'جائیداد' },
  'nav.group.people': { en: 'People', ur: 'افراد' },
  'nav.group.insights': { en: 'Insights', ur: 'بصیرت' },
  'nav.group.system': { en: 'System', ur: 'نظام' },

  'nav.dashboard': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  'nav.bookings': { en: 'Check-ins', ur: 'چیک اِنز' },
  'nav.guests': { en: 'Guests', ur: 'مہمانین' },
  'nav.stays': { en: 'Stays', ur: 'قیام' },
  'nav.branches': { en: 'Branches', ur: 'برانچیں' },
  'nav.rooms': { en: 'Rooms', ur: 'کمرے' },
  'nav.halls': { en: 'Halls', ur: 'ہال' },
  'nav.amenities': { en: 'Amenities', ur: 'سہولیات' },
  'nav.hr': { en: 'HR', ur: 'ایچ آر' },
  'nav.users': { en: 'Users', ur: 'صارفین' },
  'nav.reports': { en: 'Reports', ur: 'رپورٹس' },
  'nav.auditLog': { en: 'Audit log', ur: 'آڈٹ لاگ' },

  // Sub-page breadcrumb-only labels (not in the sidebar themselves)
  'nav.newBooking': { en: 'New check-in', ur: 'نئی چیک اِن' },
  'nav.bookingDetails': { en: 'Check-in details', ur: 'چیک اِن کی تفصیلات' },
  'nav.guestDetails': { en: 'Guest details', ur: 'مہمان کی تفصیلات' },
  'nav.stayDetails': { en: 'Stay details', ur: 'قیام کی تفصیلات' },
  'nav.buildings': { en: 'Buildings', ur: 'عمارتیں' },
  'nav.floors': { en: 'Floors', ur: 'منزلیں' },
  'nav.forbidden': { en: 'Forbidden', ur: 'ممنوع' },
};
