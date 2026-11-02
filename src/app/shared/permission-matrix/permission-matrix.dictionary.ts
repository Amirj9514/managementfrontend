import type { DictionaryEntry } from '../../core/i18n/translation.service';

/** Labels for the permission editor: one per module (screen) and per action. */
export const PERMISSION_MATRIX_DICTIONARY: Record<string, DictionaryEntry> = {
  'perm.title': { en: 'Access permissions', ur: 'رسائی کی اجازتیں' },
  'perm.hint': {
    en: 'Tick what this user can see and do on each screen. Unticked actions are hidden in the app and blocked by the server.',
    ur: 'ہر اسکرین پر وہ کام منتخب کریں جو یہ صارف دیکھ اور کر سکتا ہے۔ غیر منتخب کام ایپ میں چھپ جاتے ہیں اور سرور بھی انہیں روک دیتا ہے۔',
  },
  'perm.adminNote': {
    en: 'Admins and super admins always have full access — permissions do not apply to them.',
    ur: 'ایڈمن اور سپر ایڈمن کو ہمیشہ مکمل رسائی حاصل ہوتی ہے — ان پر اجازتیں لاگو نہیں ہوتیں۔',
  },
  'perm.screen': { en: 'Screen', ur: 'اسکرین' },
  'perm.all': { en: 'All', ur: 'سب' },
  'perm.selectAll': { en: 'Select all', ur: 'سب منتخب کریں' },
  'perm.clearAll': { en: 'Clear all', ur: 'سب ہٹائیں' },
  'perm.resetDefaults': { en: 'Reset to role defaults', ur: 'کردار کی ڈیفالٹ پر واپس' },

  'perm.module.dashboard': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  'perm.module.bookings': { en: 'Bookings', ur: 'بکنگز' },
  'perm.module.guests': { en: 'Guests', ur: 'مہمان' },
  'perm.module.checkout': { en: 'Stays', ur: 'قیام' },
  'perm.module.rooms': { en: 'Rooms', ur: 'کمرے' },
  'perm.module.halls': { en: 'Halls', ur: 'ہالز' },
  'perm.module.branches': { en: 'Branches', ur: 'برانچیں' },
  'perm.module.buildings': { en: 'Buildings & floors', ur: 'عمارتیں اور منزلیں' },
  'perm.module.amenities': { en: 'Amenities', ur: 'سہولیات' },
  'perm.module.hr': { en: 'HR (employees, attendance, leave)', ur: 'ایچ آر (ملازمین، حاضری، چھٹی)' },
  'perm.module.reports': { en: 'Reports', ur: 'رپورٹس' },

  'perm.action.view': { en: 'View', ur: 'دیکھیں' },
  'perm.action.detail': { en: 'Detail', ur: 'تفصیل' },
  'perm.action.create': { en: 'Create', ur: 'بنائیں' },
  'perm.action.edit': { en: 'Edit', ur: 'ترمیم' },
  'perm.action.delete': { en: 'Delete', ur: 'حذف' },
  'perm.action.cancel': { en: 'Cancel', ur: 'منسوخ' },
  'perm.action.documents': { en: 'Documents', ur: 'دستاویزات' },
  'perm.action.checkin': { en: 'Check-in', ur: 'چیک ان' },
  'perm.action.checkout': { en: 'Check-out', ur: 'چیک آؤٹ' },
  'perm.action.extend': { en: 'Extend', ur: 'توسیع' },
  'perm.action.transfer': { en: 'Transfer', ur: 'منتقلی' },
  'perm.action.leaveReview': { en: 'Approve leave', ur: 'چھٹی منظور کریں' },
};
