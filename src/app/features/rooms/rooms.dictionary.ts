import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const ROOMS_DICTIONARY: Record<string, DictionaryEntry> = {
  'rooms.subtitle': {
    en: 'Manage private rooms across your branches — capacity, amenities and status.',
    ur: 'اپنی برانچوں کے کمروں کا انتظام کریں — گنجائش، سہولیات اور حالت۔',
  },
  'rooms.selectBranch': { en: 'Select branch', ur: 'برانچ منتخب کریں' },
  'rooms.anyStatus': { en: 'Any status', ur: 'کوئی بھی حالت' },
  'rooms.view.grid': { en: 'Grid', ur: 'گرڈ' },
  'rooms.view.table': { en: 'Table', ur: 'جدول' },
  'rooms.roomTypes': { en: 'Room types', ur: 'کمرے کی اقسام' },
  'rooms.newRoom': { en: 'New room', ur: 'نیا کمرہ' },

  'rooms.emptyBranch.title': { en: 'Select a branch to get started', ur: 'شروع کرنے کے لیے برانچ منتخب کریں' },
  'rooms.emptyBranch.description': { en: 'Choose a branch above to see its rooms.', ur: 'اس کے کمرے دیکھنے کے لیے اوپر برانچ منتخب کریں۔' },
  'rooms.emptyRooms.title': { en: 'No rooms found', ur: 'کوئی کمرہ نہیں ملا' },
  'rooms.emptyRooms.description': {
    en: 'Try a different floor/status filter, or add a new room.',
    ur: 'کوئی مختلف منزل/حالت فلٹر آزمائیں، یا نیا کمرہ شامل کریں۔',
  },

  'rooms.capacitySummary': {
    en: '{{total}} guests max ({{adults}}A / {{children}}C)',
    ur: 'زیادہ سے زیادہ {{total}} مہمان ({{adults}} بالغ / {{children}} بچے)',
  },
  'rooms.capacityDetailed': {
    en: '{{total}} guests max ({{adults}} adults / {{children}} children)',
    ur: 'زیادہ سے زیادہ {{total}} مہمان ({{adults}} بالغ / {{children}} بچے)',
  },

  'rooms.roomType': { en: 'Room type', ur: 'کمرے کی قسم' },

  'rooms.viewDialog.header': { en: 'Room details', ur: 'کمرے کی تفصیلات' },
  'rooms.editRoom': { en: 'Edit room', ur: 'کمرے میں ترمیم کریں' },

  'rooms.formHeaderNew': { en: 'New room', ur: 'نیا کمرہ' },
  'rooms.formHeaderEdit': { en: 'Edit room', ur: 'کمرے میں ترمیم کریں' },
  'rooms.selectRoomType': { en: 'Select room type', ur: 'کمرے کی قسم منتخب کریں' },
  'rooms.roomNumber': { en: 'Room number', ur: 'کمرہ نمبر' },
  'rooms.roomNumberPlaceholder': { en: 'e.g. 101', ur: 'مثال کے طور پر 101' },
  'rooms.totalCapacity': { en: 'Total capacity', ur: 'کل گنجائش' },
  'rooms.selectAmenities': { en: 'Select amenities', ur: 'سہولیات منتخب کریں' },
  'rooms.createRoom': { en: 'Create room', ur: 'کمرہ تخلیق کریں' },

  'rooms.category': { en: 'Category', ur: 'زمرہ' },
  'rooms.maxOccupancy': { en: 'Max occupancy', ur: 'زیادہ سے زیادہ گنجائش' },
  'rooms.maxAdults': { en: 'Max adults', ur: 'زیادہ سے زیادہ بالغ' },
  'rooms.enable': { en: 'Enable', ur: 'فعال کریں' },
  'rooms.disable': { en: 'Disable', ur: 'غیر فعال کریں' },
  'rooms.newRoomTypeNameLabel': { en: 'New room type name', ur: 'نئی قسم کا نام' },
  'rooms.roomTypeNameField': { en: 'Room type name', ur: 'قسم کا نام' },
  'rooms.roomTypeNamePlaceholder': { en: 'e.g. Deluxe Double', ur: 'مثال کے طور پر ڈیلکس ڈبل' },
  'rooms.addRoomType': { en: 'Add room type', ur: 'قسم شامل کریں' },

  // Category option labels (ROOM_TYPE_CATEGORY_OPTIONS values)
  'roomCategory.single': { en: 'Single', ur: 'سنگل' },
  'roomCategory.double': { en: 'Double', ur: 'ڈبل' },
  'roomCategory.family': { en: 'Family', ur: 'فیملی' },
  'roomCategory.shared_dorm': { en: 'Shared dorm', ur: 'مشترکہ ڈورمیٹری' },
  'roomCategory.suite': { en: 'Suite', ur: 'سویٹ' },
  'roomCategory.other': { en: 'Other', ur: 'دیگر' },

  // Toasts / confirm dialogs
  'rooms.saveFailed': { en: 'Save failed', ur: 'محفوظ کرنے میں ناکامی' },
  'rooms.updateFailed': { en: 'Update failed', ur: 'اپ ڈیٹ کرنے میں ناکامی' },
  'rooms.deactivationFailed': { en: 'Deactivation failed', ur: 'غیر فعال کرنے میں ناکامی' },
  'rooms.confirmDeactivateHeader': { en: 'Confirm deactivation', ur: 'غیر فعال کرنے کی تصدیق' },
  'rooms.confirmDeactivate': { en: 'Deactivate room "{{code}}"?', ur: 'کمرہ "{{code}}" غیر فعال کریں؟' },
  'rooms.statusUpdated': { en: 'Status updated', ur: 'حالت اپ ڈیٹ ہو گئی' },
  'rooms.statusUpdatedDetail': { en: '{{code}} is now {{status}}', ur: '{{code}} اب {{status}} ہے' },
  'rooms.roomTypeCreated': { en: 'Room type created', ur: 'قسم تخلیق ہو گئی' },
};
