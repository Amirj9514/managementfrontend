import type { DictionaryEntry } from '../translation.service';

/**
 * Shared vocabulary used across the whole app — every feature area MUST reuse these keys for
 * common words (Save/Cancel/Status/Room/etc.) instead of inventing its own, so the same word
 * is never translated two different ways on two different screens.
 */
export const COMMON_DICTIONARY: Record<string, DictionaryEntry> = {
  // Actions
  'common.save': { en: 'Save', ur: 'محفوظ کریں' },
  'common.saveChanges': { en: 'Save changes', ur: 'تبدیلیاں محفوظ کریں' },
  'common.cancel': { en: 'Cancel', ur: 'منسوخ کریں' },
  'common.edit': { en: 'Edit', ur: 'ترمیم کریں' },
  'common.delete': { en: 'Delete', ur: 'حذف کریں' },
  'common.create': { en: 'Create', ur: 'تخلیق کریں' },
  'common.update': { en: 'Update', ur: 'اپ ڈیٹ کریں' },
  'common.add': { en: 'Add', ur: 'شامل کریں' },
  'common.remove': { en: 'Remove', ur: 'ہٹائیں' },
  'common.search': { en: 'Search', ur: 'تلاش کریں' },
  'common.close': { en: 'Close', ur: 'بند کریں' },
  'common.back': { en: 'Back', ur: 'واپس' },
  'common.confirm': { en: 'Confirm', ur: 'تصدیق کریں' },
  'common.view': { en: 'View', ur: 'دیکھیں' },
  'common.viewDetails': { en: 'View details', ur: 'تفصیلات دیکھیں' },
  'common.submit': { en: 'Submit', ur: 'جمع کرائیں' },
  'common.upload': { en: 'Upload', ur: 'اپ لوڈ کریں' },
  'common.download': { en: 'Download', ur: 'ڈاؤن لوڈ کریں' },
  'common.export': { en: 'Export', ur: 'ایکسپورٹ کریں' },
  'common.refresh': { en: 'Refresh', ur: 'تازہ کریں' },
  'common.select': { en: 'Select', ur: 'منتخب کریں' },
  'common.clear': { en: 'Clear', ur: 'صاف کریں' },
  'common.apply': { en: 'Apply', ur: 'لاگو کریں' },
  'common.restore': { en: 'Restore', ur: 'بحال کریں' },
  'common.next': { en: 'Next', ur: 'اگلا' },
  'common.previous': { en: 'Previous', ur: 'پچھلا' },
  'common.yes': { en: 'Yes', ur: 'جی ہاں' },
  'common.no': { en: 'No', ur: 'نہیں' },
  'common.optional': { en: 'Optional', ur: 'اختیاری' },

  // Fields
  'common.name': { en: 'Name', ur: 'نام' },
  'common.fullName': { en: 'Full name', ur: 'پورا نام' },
  'common.email': { en: 'Email', ur: 'ای میل' },
  'common.phone': { en: 'Phone', ur: 'فون' },
  'common.address': { en: 'Address', ur: 'پتہ' },
  'common.status': { en: 'Status', ur: 'حالت' },
  'common.code': { en: 'Code', ur: 'کوڈ' },
  'common.date': { en: 'Date', ur: 'تاریخ' },
  'common.notes': { en: 'Notes', ur: 'نوٹس' },
  'common.description': { en: 'Description', ur: 'تفصیل' },
  'common.created': { en: 'Created', ur: 'تخلیق کردہ' },
  'common.updated': { en: 'Updated', ur: 'اپ ڈیٹ کردہ' },
  'common.deactivated': { en: 'Deactivated', ur: 'غیر فعال کر دیا گیا' },
  'common.restored': { en: 'Restored', ur: 'بحال کر دیا گیا' },
  'common.actions': { en: 'Actions', ur: 'اعمال' },
  'common.type': { en: 'Type', ur: 'قسم' },
  'common.role': { en: 'Role', ur: 'کردار' },
  'common.branch': { en: 'Branch', ur: 'برانچ' },
  'common.building': { en: 'Building', ur: 'عمارت' },
  'common.floor': { en: 'Floor', ur: 'منزل' },
  'common.room': { en: 'Room', ur: 'کمرہ' },
  'common.hall': { en: 'Hall', ur: 'ہال' },
  'common.guest': { en: 'Guest', ur: 'مہمان' },
  'hallAudience.label': { en: 'Hall for', ur: 'ہال برائے' },
  'hallAudience.gents': { en: 'Gents', ur: 'مرد' },
  'hallAudience.ladies': { en: 'Ladies', ur: 'خواتین' },
  'hallAudience.mixed': { en: 'Mixed', ur: 'مشترکہ' },
  'common.country': { en: 'Country', ur: 'ملک' },
  'common.state': { en: 'State / Province', ur: 'صوبہ / ریاست' },
  'common.selectCountry': { en: 'Select country', ur: 'ملک منتخب کریں' },
  'common.selectState': { en: 'Select or type state', ur: 'صوبہ منتخب کریں یا لکھیں' },
  'common.enterState': { en: 'Enter state / province', ur: 'صوبہ / ریاست درج کریں' },
  'common.booking': { en: 'Check-in', ur: 'چیک اِن' },
  'common.capacity': { en: 'Capacity', ur: 'گنجائش' },
  'common.amenities': { en: 'Amenities', ur: 'سہولیات' },
  'common.password': { en: 'Password', ur: 'پاس ورڈ' },
  'common.cnic': { en: 'CNIC / Passport', ur: 'شناختی کارڈ / پاسپورٹ' },
  'common.dob': { en: 'Date of birth', ur: 'تاریخ پیدائش' },
  'common.location': { en: 'Location', ur: 'مقام' },
  'common.adults': { en: 'Adults', ur: 'بالغ' },
  'common.children': { en: 'Children', ur: 'بچے' },

  // Statuses (unit)
  'status.available': { en: 'Available', ur: 'دستیاب' },
  'status.occupied': { en: 'Occupied', ur: 'مصروف' },
  'status.cleaning': { en: 'Cleaning', ur: 'صفائی جاری' },
  'status.maintenance': { en: 'Maintenance', ur: 'مرمت' },
  'status.active': { en: 'Active', ur: 'فعال' },
  'status.inactive': { en: 'Inactive', ur: 'غیر فعال' },

  // Booking statuses — same flat `status.*` namespace as unit statuses above, since
  // StatusBadgeComponent derives a key from whatever raw status string it's given,
  // regardless of which feature that status belongs to.
  'status.reserved': { en: 'Reserved', ur: 'محفوظ شدہ' },
  'status.checkedIn': { en: 'Checked in', ur: 'چیک ان' },
  'status.checkedOut': { en: 'Checked out', ur: 'چیک آؤٹ' },
  'status.cancelled': { en: 'Cancelled', ur: 'منسوخ شدہ' },
  'status.noShow': { en: 'No show', ur: 'عدم حاضری' },

  // Messages
  'common.loading': { en: 'Loading…', ur: 'لوڈ ہو رہا ہے…' },
  'common.noResults': { en: 'No results found', ur: 'کوئی نتیجہ نہیں ملا' },
  'common.noData': { en: 'No data available', ur: 'کوئی ڈیٹا دستیاب نہیں' },
  'common.error': { en: 'Error', ur: 'خرابی' },
  'common.success': { en: 'Success', ur: 'کامیابی' },
  'common.confirmDeleteTitle': { en: 'Confirm deletion', ur: 'حذف کرنے کی تصدیق' },
  'common.confirmDeleteMessage': {
    en: 'This cannot be undone.',
    ur: 'اسے واپس نہیں کیا جا سکتا۔',
  },
  'common.areYouSure': { en: 'Are you sure?', ur: 'کیا آپ کو یقین ہے؟' },

  // Pagination
  'common.of': { en: 'of', ur: 'از' },
  'common.rowsPerPage': { en: 'Rows per page', ur: 'فی صفحہ قطاریں' },

  // Entities (plural, used in section headings across many pages)
  'entity.guests': { en: 'Guests', ur: 'مہمانین' },
  'entity.bookings': { en: 'Check-ins', ur: 'چیک اِنز' },
  'entity.rooms': { en: 'Rooms', ur: 'کمرے' },
  'entity.halls': { en: 'Halls', ur: 'ہال' },
  'entity.branches': { en: 'Branches', ur: 'برانچیں' },
  'entity.buildings': { en: 'Buildings', ur: 'عمارتیں' },
  'entity.floors': { en: 'Floors', ur: 'منزلیں' },
  'entity.users': { en: 'Users', ur: 'صارفین' },
  'entity.employees': { en: 'Employees', ur: 'ملازمین' },
  'entity.reports': { en: 'Reports', ur: 'رپورٹس' },
  'entity.amenities': { en: 'Amenities', ur: 'سہولیات' },
  'entity.auditLog': { en: 'Audit log', ur: 'آڈٹ لاگ' },
  'entity.stays': { en: 'Stays', ur: 'قیام' },

  // Staff roles (USER_ROLES in core/models/roles.model.ts) — shared since role names appear
  // on the dashboard greeting, the Users admin screens, and HR.
  'role.super_admin': { en: 'Super Admin', ur: 'سپر ایڈمن' },
  'role.admin': { en: 'Admin', ur: 'ایڈمن' },
  'role.branch_admin': { en: 'Branch Admin', ur: 'برانچ ایڈمن' },
  'role.building_admin': { en: 'Building Admin', ur: 'عمارت ایڈمن' },
  'role.booking_admin': { en: 'Check-in Admin', ur: 'چیک اِن ایڈمن' },
  'role.employee_admin': { en: 'Employee Admin', ur: 'ملازم ایڈمن' },
  'role.front_desk': { en: 'Front Desk', ur: 'فرنٹ ڈیسک' },
  'role.housekeeping': { en: 'Housekeeping', ur: 'ہاؤس کیپنگ' },
  'role.staff': { en: 'Staff', ur: 'عملہ' },

  // Generic form-validation message templates (FieldErrorComponent) — `{{label}}` is
  // substituted with whatever field label the calling form already translated.
  'validation.required': { en: '{{label}} is required.', ur: '{{label}} درکار ہے۔' },
  'validation.email': { en: 'Enter a valid email address.', ur: 'ایک درست ای میل پتہ درج کریں۔' },
  'validation.min': { en: '{{label}} must be at least {{min}}.', ur: '{{label}} کم از کم {{min}} ہونا چاہیے۔' },
  'validation.max': { en: '{{label}} must be at most {{max}}.', ur: '{{label}} زیادہ سے زیادہ {{max}} ہونا چاہیے۔' },
  'validation.minlength': {
    en: '{{label}} must be at least {{length}} characters.',
    ur: '{{label}} کم از کم {{length}} حروف کا ہونا چاہیے۔',
  },
  'validation.maxlength': {
    en: '{{label}} must be at most {{length}} characters.',
    ur: '{{label}} زیادہ سے زیادہ {{length}} حروف کا ہونا چاہیے۔',
  },
  'validation.pattern': { en: '{{label}} format is invalid.', ur: '{{label}} کی شکل درست نہیں ہے۔' },
  'validation.invalid': { en: '{{label}} is invalid.', ur: '{{label}} درست نہیں ہے۔' },
  'validation.defaultLabel': { en: 'This field', ur: 'یہ خانہ' },

  // Shell chrome
  'shell.brand': { en: 'Management', ur: 'انتظام' },
  'shell.logout': { en: 'Log out', ur: 'لاگ آؤٹ' },
  'shell.language': { en: 'Language', ur: 'زبان' },
  'shell.toggleSidebar': { en: 'Toggle sidebar', ur: 'سائیڈ بار ٹوگل کریں' },
  'shell.openMenu': { en: 'Open menu', ur: 'مینو کھولیں' },
};
