import type { DictionaryEntry } from '../../core/i18n/translation.service';

/**
 * Shared vocabulary for the Bookings feature (list, wizard, detail body/page, and the
 * booking-detail drawer) — registered by every component in this feature since they overlap
 * heavily. Reuses COMMON_DICTIONARY/NAV_DICTIONARY keys wherever those already cover a word
 * (Save/Cancel/Status/Room/Hall/Guest/Booking/statuses/etc.) — only genuinely feature-specific
 * strings get a new key here.
 */
export const BOOKINGS_DICTIONARY: Record<string, DictionaryEntry> = {
  // Booking list
  'bookings.list.subtitle': {
    en: 'Reservations, walk-ins, and stays across rooms and halls.',
    ur: 'کمروں اور ہالوں میں ریزرویشنز، واک اِنز، اور قیام۔',
  },
  'bookings.selectBranch': { en: 'Select branch', ur: 'برانچ منتخب کریں' },
  'bookings.anyStatus': { en: 'Any status', ur: 'کوئی بھی حالت' },
  'bookings.anyType': { en: 'Any type', ur: 'کوئی بھی قسم' },
  'bookings.bookingNumber': { en: 'Check-in #', ur: 'چیک اِن نمبر' },
  'bookings.source': { en: 'Source', ur: 'ذریعہ' },
  'bookings.source.reservation': { en: 'Reservation', ur: 'ریزرویشن' },
  'bookings.source.walkIn': { en: 'Walk-in', ur: 'واک اِن' },
  'bookings.viewBooking': { en: 'View check-in', ur: 'چیک اِن دیکھیں' },
  'bookings.view.cards': { en: 'Card view', ur: 'کارڈ ویو' },
  'bookings.view.table': { en: 'Table view', ur: 'ٹیبل ویو' },
  'bookings.searchNumber': { en: 'Search check-in #', ur: 'چیک اِن نمبر تلاش کریں' },
  'bookings.guestColumn': { en: 'Guest', ur: 'مہمان' },
  'bookings.unitColumn': { en: 'Room / Hall', ur: 'کمرہ / ہال' },
  'bookings.stayColumn': { en: 'Stay', ur: 'قیام' },
  'bookings.unknownGuest': { en: 'Unknown guest', ur: 'نامعلوم مہمان' },
  'bookings.docCount': { en: '{{count}} doc(s)', ur: '{{count}} دستاویز' },
  'bookings.emptyTitle': { en: 'No check-ins found', ur: 'کوئی چیک اِن نہیں ملی' },
  'bookings.emptyDescription': {
    en: 'Try a different filter, or create a new check-in.',
    ur: 'ایک مختلف فلٹر آزمائیں، یا نئی چیک اِن بنائیں۔',
  },

  // Wizard — shell & steps
  'bookings.wizard.subtitle': {
    en: 'Reservation, walk-in, or group check-in — four quick steps.',
    ur: 'ریزرویشن، واک اِن، یا گروپ چیک ان — چار آسان مراحل۔',
  },
  'bookings.wizard.step.guestInfo': { en: 'Guest Information', ur: 'مہمان کی معلومات' },
  'bookings.wizard.step.stayDetails': { en: 'Stay Details', ur: 'قیام کی تفصیلات' },
  'bookings.wizard.step.roomSelection': { en: 'Room Selection', ur: 'کمرے کا انتخاب' },
  'bookings.wizard.step.confirmation': { en: 'Confirmation', ur: 'تصدیق' },

  // Wizard — step 1
  'bookings.referenceBy': { en: 'Reference by', ur: 'حوالہ' },
  'bookings.referenceByPlaceholder': { en: 'Who referred this guest? (optional)', ur: 'اس مہمان کا حوالہ کس نے دیا؟ (اختیاری)' },
  'bookings.companionsTitle': { en: 'Accompanying guests', ur: 'ساتھ آنے والے مہمان' },
  'bookings.companionsSubtitle': {
    en: 'People staying with the primary guest — name, ID and relation.',
    ur: 'بنیادی مہمان کے ساتھ قیام کرنے والے افراد — نام، شناخت اور رشتہ۔',
  },
  'bookings.companionCount': { en: 'Number of guests with them', ur: 'ساتھ مہمانوں کی تعداد' },
  'bookings.companionsEmpty': {
    en: 'Staying alone. Increase the number above to add accompanying guests.',
    ur: 'اکیلے قیام۔ ساتھ آنے والے مہمان شامل کرنے کے لیے اوپر تعداد بڑھائیں۔',
  },
  'bookings.companionN': { en: 'Accompanying guest {{n}}', ur: 'ساتھی مہمان {{n}}' },
  'bookings.relationWithPrimary': { en: 'Relation with primary guest', ur: 'بنیادی مہمان سے رشتہ' },
  'bookings.selectRelation': { en: 'Select relation', ur: 'رشتہ منتخب کریں' },
  'bookings.idDocument': { en: 'ID document', ur: 'شناختی دستاویز' },
  'bookings.idType.passport': { en: 'Passport', ur: 'پاسپورٹ' },
  'bookings.cnicNumber': { en: 'CNIC number', ur: 'شناختی کارڈ نمبر' },
  'bookings.passportNumber': { en: 'Passport number', ur: 'پاسپورٹ نمبر' },
  'bookings.relation.spouse': { en: 'Spouse', ur: 'شریکِ حیات' },
  'bookings.relation.child': { en: 'Child', ur: 'بچہ' },
  'bookings.relation.parent': { en: 'Parent', ur: 'والدین' },
  'bookings.relation.sibling': { en: 'Sibling', ur: 'بہن / بھائی' },
  'bookings.relation.relative': { en: 'Relative', ur: 'رشتہ دار' },
  'bookings.relation.friend': { en: 'Friend', ur: 'دوست' },
  'bookings.relation.colleague': { en: 'Colleague', ur: 'ساتھی کارکن' },
  'bookings.relation.driver': { en: 'Driver / Staff', ur: 'ڈرائیور / عملہ' },
  'bookings.relation.other': { en: 'Other', ur: 'دیگر' },
  'bookings.missing.companionNames': { en: 'a name for every accompanying guest', ur: 'ہر ساتھی مہمان کا نام' },
  'bookings.occupancySubtitle': {
    en: '{{count}} people in this party, prefilled from step 1 — adjust adults and children.',
    ur: 'اس گروپ میں {{count}} افراد، پہلے مرحلے سے — بالغ اور بچے درست کریں۔',
  },
  'bookings.wizard.guestSectionTitle': { en: 'Guest', ur: 'مہمان' },
  'bookings.wizard.guestSectionSubtitle': {
    en: 'Search for a returning guest, or create a new one.',
    ur: 'واپس آنے والے مہمان کو تلاش کریں، یا نیا مہمان بنائیں۔',
  },
  'bookings.wizard.staySectionTitle': { en: 'Stay & accommodation', ur: 'قیام اور رہائش' },
  'bookings.wizard.staySectionSubtitle': {
    en: 'Branch, dates, and party size for this check-in.',
    ur: 'اس چیک اِن کے لیے برانچ، تاریخیں، اور افراد کی تعداد۔',
  },
  'bookings.accommodation.room': { en: 'Private room', ur: 'نجی کمرہ' },
  'bookings.accommodation.hall': { en: 'Public hall', ur: 'عوامی ہال' },
  'bookings.checkInDate': { en: 'Check-in date', ur: 'چیک ان کی تاریخ' },
  'bookings.checkOutDate': { en: 'Expected checkout', ur: 'متوقع چیک آؤٹ' },
  'bookings.partySize': { en: 'Party size', ur: 'افراد کی تعداد' },
  'bookings.walkInLabel': { en: 'Check in immediately (walk-in)', ur: 'فوری چیک ان کریں (واک اِن)' },
  'bookings.walkInHelp.today': {
    en: 'Guest will be checked in as soon as you confirm.',
    ur: 'تصدیق کرتے ہی مہمان کو چیک ان کر دیا جائے گا۔',
  },
  'bookings.walkInHelp.future': {
    en: 'Only available when check-in date is today — this stay is a future reservation.',
    ur: 'یہ صرف اس وقت دستیاب ہے جب چیک ان کی تاریخ آج ہو — یہ قیام ایک مستقبل کی ریزرویشن ہے۔',
  },
  'bookings.partyFromGuestStep': { en: 'From guest information', ur: 'مہمان کی معلومات سے' },
  'bookings.autoCheckInToday': {
    en: 'The guest will be checked in automatically when you confirm.',
    ur: 'تصدیق کرتے ہی مہمان خود بخود چیک اِن ہو جائے گا۔',
  },
  'bookings.autoCheckInFuture': {
    en: 'Future date — this will be saved as a reservation and checked in when the guest arrives.',
    ur: 'مستقبل کی تاریخ — یہ ریزرویشن کے طور پر محفوظ ہوگی اور مہمان کی آمد پر چیک اِن ہوگی۔',
  },
  'bookings.nightsCount': { en: '{{count}} night(s)', ur: '{{count}} رات' },
  'bookings.stayLength': { en: 'Nights', ur: 'راتیں' },
  'bookings.docsSectionTitle': { en: 'Documents', ur: 'دستاویزات' },
  'bookings.docsSectionSubtitle': {
    en: 'Optional — CNIC, passport, or any paperwork. Uploaded when you confirm.',
    ur: 'اختیاری — شناختی کارڈ، پاسپورٹ، یا کوئی کاغذات۔ تصدیق پر اپ لوڈ ہوں گے۔',
  },
  'bookings.dropFilesHere': { en: 'Click to choose files', ur: 'فائلیں منتخب کرنے کے لیے کلک کریں' },
  'bookings.fileTypesHint': { en: 'Images or PDF · up to 5 MB each', ur: 'تصاویر یا PDF · ہر ایک 5 MB تک' },
  'bookings.notesSectionTitle': { en: 'Check-in notes', ur: 'چیک اِن نوٹس' },
  'bookings.notesSectionSubtitle': {
    en: 'Optional — anything staff should know about this stay.',
    ur: 'اختیاری — کوئی بھی بات جو عملے کو اس قیام کے بارے میں معلوم ہونی چاہیے۔',
  },
  'bookings.notesPlaceholder': {
    en: 'e.g. arriving late, requested a quiet room, travelling with an infant…',
    ur: 'مثلاً دیر سے آمد، پرسکون کمرے کی درخواست، شیرخوار بچے کے ساتھ سفر…',
  },
  'bookings.stillNeeded': { en: 'Still needed: {{items}}.', ur: 'ابھی درکار: {{items}}۔' },
  'bookings.missing.guest': { en: 'a guest', ur: 'ایک مہمان' },
  'bookings.missing.branch': { en: 'a branch', ur: 'ایک برانچ' },
  'bookings.missing.checkInDate': { en: 'a check-in date', ur: 'چیک ان کی تاریخ' },
  'bookings.missing.checkOutDate': { en: 'a checkout date', ur: 'چیک آؤٹ کی تاریخ' },
  'bookings.missing.checkOutAfterCheckIn': {
    en: 'a checkout date after check-in',
    ur: 'چیک ان کے بعد کی چیک آؤٹ تاریخ',
  },
  'bookings.missing.atLeastOneAdult': { en: 'at least 1 adult', ur: 'کم از کم 1 بالغ' },
  'bookings.missing.partySize': { en: 'a party size', ur: 'افراد کی تعداد' },

  // Wizard — step 2 (room selection)
  'bookings.roomSelectionTitle': { en: 'Room selection', ur: 'کمرے کا انتخاب' },
  'bookings.availableSummary': {
    en: '{{available}} of {{total}} {{unitWord}} are free for your dates',
    ur: '{{total}} میں سے {{available}} {{unitWord}} آپ کی تاریخوں کے لیے خالی ہیں',
  },
  'bookings.unitsWord.rooms': { en: 'rooms', ur: 'کمرے' },
  'bookings.unitsWord.halls': { en: 'halls', ur: 'ہال' },
  'bookings.allBuildings': { en: 'All buildings', ur: 'تمام عمارتیں' },
  'bookings.allFloors': { en: 'All floors', ur: 'تمام منزلیں' },
  'bookings.legend.fitsFewerGuests': { en: 'Fits fewer guests than requested', ur: 'درخواست سے کم مہمانوں کی گنجائش' },
  'bookings.noUnitsMatch': { en: 'No {{unitWord}} match this filter yet.', ur: 'اس فلٹر سے کوئی {{unitWord}} نہیں ملا۔' },
  'bookings.reason.booked': { en: 'Already booked for these dates', ur: 'ان تاریخوں کے لیے پہلے سے بک ہے' },
  'bookings.reason.occupied': { en: 'Currently occupied', ur: 'فی الحال مصروف' },
  'bookings.reason.cleaning': { en: 'Being cleaned', ur: 'صفائی ہو رہی ہے' },
  'bookings.reason.maintenance': { en: 'Under maintenance', ur: 'زیرِ مرمت' },
  'bookings.reason.unavailable': { en: 'Unavailable', ur: 'دستیاب نہیں' },
  'bookings.fitsUpTo': {
    en: 'Fits up to {{total}} guests — {{needed}} requested',
    ur: '{{total}} مہمانوں تک گنجائش — {{needed}} درکار',
  },
  'bookings.spotsLeftRequested': {
    en: 'Only {{remaining}} of {{max}} spots left — {{needed}} requested',
    ur: 'صرف {{max}} میں سے {{remaining}} جگہ باقی — {{needed}} درکار',
  },
  'bookings.publicHall': { en: 'Public hall', ur: 'عوامی ہال' },
  'bookings.locationUnassigned': { en: 'Location unassigned', ur: 'مقام غیر متعین' },
  'bookings.capacityCount': { en: 'Capacity {{count}}', ur: 'گنجائش {{count}}' },
  'bookings.upToGuests': { en: 'Up to {{count}} guests', ur: '{{count}} مہمانوں تک' },
  'bookings.spotsAvailable': { en: '{{remaining}} of {{max}} spots available', ur: '{{max}} میں سے {{remaining}} جگہ دستیاب' },

  // Wizard — step 3 (confirmation)
  'bookings.confirmedTitle': { en: 'Check-in confirmed', ur: 'چیک اِن کی تصدیق ہو گئی' },
  'bookings.bookingNumberFull': { en: 'Check-in number', ur: 'چیک اِن نمبر' },
  'bookings.startAnother': { en: 'Start another check-in', ur: 'ایک اور چیک اِن شروع کریں' },
  'bookings.documentsTitle': { en: 'Documents', ur: 'دستاویزات' },
  'bookings.attachDocument': { en: 'Attach document', ur: 'دستاویز منسلک کریں' },
  'bookings.noDocumentsYet': { en: 'No documents attached yet — optional.', ur: 'ابھی تک کوئی دستاویز منسلک نہیں — اختیاری۔' },
  'bookings.viewDownload': { en: 'View / download', ur: 'دیکھیں / ڈاؤن لوڈ کریں' },
  'bookings.confirmBooking': { en: 'Confirm check-in', ur: 'چیک اِن کی تصدیق کریں' },

  // Detail body
  'bookings.cancelBooking': { en: 'Cancel check-in', ur: 'چیک اِن منسوخ کریں' },
  'bookings.bookingTypeLine': { en: 'Check-in · {{type}}', ur: 'چیک اِن · {{type}}' },
  'bookings.primary': { en: 'Primary', ur: 'بنیادی' },
  'bookings.noGuestInfo': { en: 'No guest information available.', ur: 'کوئی مہمان کی معلومات دستیاب نہیں۔' },
  'bookings.linesCardHeader': { en: 'Check-in lines', ur: 'چیک اِن لائنز' },
  'bookings.datesLabel': { en: 'Dates', ur: 'تاریخیں' },
  'bookings.occupancy': { en: 'Occupancy', ur: 'قیام پذیری' },
  'bookings.guestsCount': { en: '{{count}} guests', ur: '{{count}} مہمان' },
  'bookings.partyOf': { en: 'Party of {{count}}', ur: '{{count}} افراد کا گروپ' },
  'bookings.capacityParen': { en: '({{capacity}} capacity)', ur: '({{capacity}} گنجائش)' },
  'bookings.action.checkIn': { en: 'Check in', ur: 'چیک ان' },
  'bookings.action.checkOut': { en: 'Check out', ur: 'چیک آؤٹ' },
  'bookings.action.transfer': { en: 'Transfer', ur: 'منتقل کریں' },
  'bookings.action.extend': { en: 'Extend', ur: 'توسیع کریں' },
  'bookings.noActionsAvailable': { en: 'No actions available', ur: 'کوئی عمل دستیاب نہیں' },
  'bookings.extendStayHeader': { en: 'Extend stay', ur: 'قیام میں توسیع کریں' },
  'bookings.newExpectedCheckout': { en: 'New expected checkout', ur: 'نئی متوقع چیک آؤٹ' },
  'bookings.transferRoomHeader': { en: 'Transfer room', ur: 'کمرہ منتقل کریں' },
  'bookings.targetRoom': { en: 'Target room', ur: 'ہدف کمرہ' },
  'bookings.selectAvailableRoom': { en: 'Select an available room', ur: 'ایک دستیاب کمرہ منتخب کریں' },
  'bookings.reasonOptional': { en: 'Reason (optional)', ur: 'وجہ (اختیاری)' },

  // Detail page
  'bookings.detailSubtitle': { en: 'View and manage this check-in.', ur: 'اس چیک اِن کو دیکھیں اور منظم کریں۔' },
  'bookings.backToBookings': { en: 'Back to check-ins', ur: 'چیک اِنز کی طرف واپس جائیں' },

  // Toasts
  'bookings.toast.capacityOverride': { en: 'More guests than room capacity', ur: 'کمرے کی گنجائش سے زیادہ مہمان' },
  'bookings.toast.capacityOverrideDetail': {
    en: '{{code}}: {{message}}. Selected anyway.',
    ur: '{{code}}: {{message}}۔ پھر بھی منتخب کیا گیا۔',
  },
  'bookings.toast.bookingFailed': { en: 'Could not create check-in', ur: 'چیک اِن نہیں بن سکی' },
  'bookings.toast.pendingDocumentsFailed': {
    en: 'Check-in saved, but some documents did not upload — attach them again below.',
    ur: 'چیک اِن محفوظ ہو گئی، لیکن کچھ دستاویزات اپ لوڈ نہیں ہوئیں — نیچے دوبارہ منسلک کریں۔',
  },
  'bookings.toast.fileTooLarge': { en: '{{name}} is larger than 5 MB', ur: '{{name}} کا سائز 5 MB سے زیادہ ہے' },
  'bookings.toast.documentUploadFailed': { en: 'Document upload failed', ur: 'دستاویز اپ لوڈ ناکام ہو گئی' },
  'bookings.toast.removeDocumentFailed': { en: 'Could not remove document', ur: 'دستاویز حذف نہیں کی جا سکی' },
  'bookings.toast.openDocumentFailed': { en: 'Could not open document', ur: 'دستاویز کھولی نہیں جا سکی' },
  'bookings.toast.lineCancelled': { en: 'Line cancelled', ur: 'لائن منسوخ کر دی گئی' },
  'bookings.toast.bookingCancelled': { en: 'Check-in cancelled', ur: 'چیک اِن منسوخ کر دی گئی' },
  'bookings.toast.extended': { en: 'Extended', ur: 'توسیع کر دی گئی' },
  'bookings.toast.transferred': { en: 'Transferred', ur: 'منتقل کر دیا گیا' },
  'bookings.toast.checkInFailed': { en: 'Check-in failed', ur: 'چیک ان ناکام ہو گیا' },
  'bookings.toast.checkOutFailed': { en: 'Check-out failed', ur: 'چیک آؤٹ ناکام ہو گیا' },
  'bookings.toast.cancelFailed': { en: 'Cancel failed', ur: 'منسوخی ناکام ہو گئی' },
  'bookings.toast.extensionFailed': { en: 'Extension failed', ur: 'توسیع ناکام ہو گئی' },
  'bookings.toast.transferFailed': { en: 'Transfer failed', ur: 'منتقلی ناکام ہو گئی' },
};
