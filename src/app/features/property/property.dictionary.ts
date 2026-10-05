import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const PROPERTY_DICTIONARY: Record<string, DictionaryEntry> = {
  // Building list page
  'property.buildings.title': { en: 'Property Structure', ur: 'جائیداد کا ڈھانچہ' },
  'property.buildings.subtitle': {
    en: 'Manage buildings and floors. Expand a building to see and manage its floors.',
    ur: 'عمارتوں اور منزلوں کا انتظام کریں۔ منزلیں دیکھنے اور ان کا انتظام کرنے کے لیے عمارت کو پھیلائیں۔',
  },
  'property.newBuilding': { en: 'New building', ur: 'نئی عمارت' },
  'property.filter.active': { en: 'Active', ur: 'فعال' },
  'property.filter.inactive': { en: 'Inactive / Deleted', ur: 'غیر فعال / حذف شدہ' },
  'property.filter.all': { en: 'All', ur: 'تمام' },
  'property.filterByStatus': { en: 'Filter by status', ur: 'حالت کے مطابق فلٹر کریں' },
  'property.filterByBranch': { en: 'Filter by branch', ur: 'برانچ کے مطابق فلٹر کریں' },
  'property.empty.buildings.title': { en: 'No buildings found', ur: 'کوئی عمارت نہیں ملی' },
  'property.empty.buildings.description': {
    en: 'Try adjusting your filters or add a new building.',
    ur: 'اپنے فلٹرز کو تبدیل کریں یا نئی عمارت شامل کریں۔',
  },
  'property.floorsFor': { en: 'Floors for {{name}}', ur: '{{name}} کی منزلیں' },
  'property.addFloor': { en: 'Add Floor', ur: 'منزل شامل کریں' },
  'property.noFloorsYet': { en: 'No floors added to this building yet.', ur: 'اس عمارت میں ابھی تک کوئی منزل شامل نہیں کی گئی۔' },
  'property.lastUpdated': { en: 'Last Updated', ur: 'آخری اپ ڈیٹ' },

  // Building form drawer
  'property.newBuildingHeader': { en: 'New Building', ur: 'نئی عمارت' },
  'property.editBuildingHeader': { en: 'Edit Building', ur: 'عمارت میں ترمیم کریں' },
  'property.selectBranch': { en: 'Select Branch', ur: 'برانچ منتخب کریں' },
  'property.buildingName': { en: 'Building Name', ur: 'عمارت کا نام' },
  'property.buildingNamePlaceholder': { en: 'e.g. Tower A', ur: 'مثال کے طور پر ٹاور اے' },
  'property.createBuilding': { en: 'Create Building', ur: 'عمارت تخلیق کریں' },

  // Floor form drawer (shared by building-list + floor-list)
  'property.addFloorHeader': { en: 'Add Floor', ur: 'منزل شامل کریں' },
  'property.editFloorHeader': { en: 'Edit Floor', ur: 'منزل میں ترمیم کریں' },
  'property.building': { en: 'Building', ur: 'عمارت' },
  'property.floorLabel': { en: 'Floor Label', ur: 'منزل کا لیبل' },
  'property.floorLabelPlaceholder': { en: 'e.g. 1st Floor, Ground Floor', ur: 'مثال کے طور پر پہلی منزل، گراؤنڈ فلور' },
  'property.floorLabelHint': {
    en: 'Provide a clear name that guests and staff will recognize.',
    ur: 'واضح نام درج کریں جسے مہمان اور عملہ آسانی سے پہچان سکیں۔',
  },

  // Floor list page
  'property.floorsTitle': { en: 'Floors', ur: 'منزلیں' },
  'property.floorsTitleFor': { en: 'Floors — {{name}}', ur: '{{name}} — منزلیں' },
  'property.floorsSubtitle': {
    en: 'Manage levels within this building. Sort order is handled automatically.',
    ur: 'اس عمارت کے اندر درجات کا انتظام کریں۔ ترتیب خودکار طور پر طے ہوتی ہے۔',
  },
  'property.backToBranches': { en: 'Back to Branches', ur: 'برانچوں پر واپس جائیں' },
  'property.newFloor': { en: 'New Floor', ur: 'نئی منزل' },
  'property.empty.floors.title': { en: 'No floors found', ur: 'کوئی منزل نہیں ملی' },
  'property.empty.floors.description': {
    en: "It look like this building doesn't have any floors registered yet. Click the button below to add the first level.",
    ur: 'ایسا لگتا ہے کہ اس عمارت میں ابھی تک کوئی منزل درج نہیں کی گئی۔ پہلی منزل شامل کرنے کے لیے نیچے دیا گیا بٹن دبائیں۔',
  },
  'property.addFirstFloor': { en: 'Add First Floor', ur: 'پہلی منزل شامل کریں' },

  // Menu items
  'property.menu.edit': { en: 'Edit', ur: 'ترمیم کریں' },
  'property.menu.addFloor': { en: 'Add Floor', ur: 'منزل شامل کریں' },
  'property.menu.editBuilding': { en: 'Edit Building', ur: 'عمارت میں ترمیم کریں' },
  'property.menu.restore': { en: 'Restore', ur: 'بحال کریں' },
  'property.menu.deleteForever': { en: 'Delete Forever', ur: 'ہمیشہ کے لیے حذف کریں' },
  'property.menu.deactivate': { en: 'Deactivate', ur: 'غیر فعال کریں' },

  // Toasts / confirm dialogs
  'property.confirmDeactivationHeader': { en: 'Confirm Deactivation', ur: 'غیر فعالیت کی تصدیق' },
  'property.confirmDeactivateBuilding': { en: 'Are you sure you want to deactivate {{name}}?', ur: 'کیا آپ واقعی {{name}} کو غیر فعال کرنا چاہتے ہیں؟' },
  'property.confirmDeactivateFloor': { en: 'Are you sure you want to deactivate floor {{label}}?', ur: 'کیا آپ واقعی منزل {{label}} کو غیر فعال کرنا چاہتے ہیں؟' },
  'property.permanentDeleteHeader': { en: 'PERMANENT DELETE', ur: 'مستقل حذف' },
  'property.confirmPermanentDeleteBuilding': {
    en: 'PERMANENT DELETE: This will completely remove {{name}} from the database. This action cannot be undone. Proceed?',
    ur: 'مستقل حذف: یہ {{name}} کو ڈیٹا بیس سے مکمل طور پر ہٹا دے گا۔ یہ عمل واپس نہیں کیا جا سکتا۔ آگے بڑھیں؟',
  },
  'property.confirmPermanentDeleteFloor': {
    en: 'PERMANENT DELETE: This will completely remove floor {{label}} from the database. Proceed?',
    ur: 'مستقل حذف: یہ منزل {{label}} کو ڈیٹا بیس سے مکمل طور پر ہٹا دے گا۔ آگے بڑھیں؟',
  },
  'property.buildingCreated': { en: 'Building created', ur: 'عمارت تخلیق ہو گئی' },
  'property.creationFailed': { en: 'Creation failed', ur: 'تخلیق میں ناکامی' },
  'property.buildingDetailsSaved': { en: 'Building details saved.', ur: 'عمارت کی تفصیلات محفوظ ہو گئیں۔' },
  'property.updateFailed': { en: 'Update failed', ur: 'اپ ڈیٹ کرنے میں ناکامی' },
  'property.buildingMarkedInactive': { en: 'Building marked as inactive.', ur: 'عمارت کو غیر فعال نشان زد کر دیا گیا۔' },
  'property.deactivationFailed': { en: 'Deactivation failed', ur: 'غیر فعال کرنے میں ناکامی' },
  'property.buildingActiveAgain': { en: 'Building is now active again.', ur: 'عمارت دوبارہ فعال ہو گئی۔' },
  'property.restorationFailed': { en: 'Restoration failed', ur: 'بحالی میں ناکامی' },
  'property.permanentlyDeleted': { en: 'Permanently Deleted', ur: 'مستقل طور پر حذف ہو گیا' },
  'property.buildingRemoved': { en: 'Building removed from system.', ur: 'عمارت نظام سے ہٹا دی گئی۔' },
  'property.permanentDeletionFailed': { en: 'Permanent deletion failed', ur: 'مستقل حذف میں ناکامی' },

  'property.floorAdded': { en: 'Floor added', ur: 'منزل شامل ہو گئی' },
  'property.floorCreationFailed': { en: 'Floor creation failed', ur: 'منزل کی تخلیق میں ناکامی' },
  'property.floorDetailsSaved': { en: 'Floor details saved.', ur: 'منزل کی تفصیلات محفوظ ہو گئیں۔' },
  'property.floorUpdated': { en: 'Floor updated.', ur: 'منزل اپ ڈیٹ ہو گئی۔' },
  'property.floorMarkedInactive': { en: 'Floor marked as inactive.', ur: 'منزل کو غیر فعال نشان زد کر دیا گیا۔' },
  'property.floorActiveAgain': { en: 'Floor is active again.', ur: 'منزل دوبارہ فعال ہو گئی۔' },
  'property.floorRemoved': { en: 'Floor removed.', ur: 'منزل ہٹا دی گئی۔' },
  'property.couldNotLoadBuilding': { en: 'Could not load building details.', ur: 'عمارت کی تفصیلات لوڈ نہیں ہو سکیں۔' },
};
