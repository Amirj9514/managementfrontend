import type { DictionaryEntry } from '../../core/i18n/translation.service';

/** Housekeeping (room cleaning) vocabulary. */
export const HOUSEKEEPING_DICTIONARY: Record<string, DictionaryEntry> = {
  'hk.subtitle': {
    en: 'Rooms that need cleaning: give them to a cleaner, they clean, you verify — then the room is available again.',
    ur: 'جن کمروں کی صفائی ضروری ہے: صفائی والے کو دیں، وہ صفائی کرے، آپ تصدیق کریں — پھر کمرہ دوبارہ دستیاب ہو جاتا ہے۔',
  },
  'hk.allBuildings': { en: 'All buildings', ur: 'تمام عمارتیں' },
  'hk.myJobs': { en: 'My jobs only', ur: 'صرف میرے کام' },
  'hk.refresh': { en: 'Refresh', ur: 'تازہ کریں' },
  'hk.sendRoom': { en: 'Send a room for cleaning', ur: 'کمرہ صفائی کے لیے بھیجیں' },

  'hk.col.todo': { en: 'To clean', ur: 'صفائی باقی' },
  'hk.col.todoHint': { en: 'Waiting for a cleaner', ur: 'صفائی والے کے منتظر' },
  'hk.col.working': { en: 'Cleaning', ur: 'صفائی جاری' },
  'hk.col.workingHint': { en: 'Given to a cleaner', ur: 'صفائی والے کو دیے گئے' },
  'hk.col.review': { en: 'Verify', ur: 'تصدیق' },
  'hk.col.reviewHint': { en: 'Cleaned — needs a check', ur: 'صاف ہو گئے — جانچ باقی' },
  'hk.col.done': { en: 'Ready today', ur: 'آج تیار' },
  'hk.col.doneHint': { en: 'Verified, available again', ur: 'تصدیق شدہ، دوبارہ دستیاب' },

  'hk.status.pending': { en: 'Not assigned', ur: 'مقرر نہیں' },
  'hk.status.assigned': { en: 'Assigned', ur: 'مقرر' },
  'hk.status.in_progress': { en: 'Cleaning', ur: 'صفائی جاری' },
  'hk.status.awaiting_verification': { en: 'Awaiting check', ur: 'جانچ کا انتظار' },
  'hk.status.done': { en: 'Done', ur: 'مکمل' },

  'hk.source.checkout': { en: 'After check-out', ur: 'چیک آؤٹ کے بعد' },
  'hk.source.transfer': { en: 'After transfer', ur: 'منتقلی کے بعد' },
  'hk.source.manual': { en: 'Requested', ur: 'درخواست پر' },

  'hk.waiting': { en: 'Waiting {{time}}', ur: '{{time}} سے منتظر' },
  'hk.redo': { en: 'Redo ×{{count}}', ur: 'دوبارہ ×{{count}}' },
  'hk.sentBack': { en: 'Sent back: {{note}}', ur: 'واپس بھیجا: {{note}}' },
  'hk.assignedTo': { en: 'Cleaner', ur: 'صفائی والا' },
  'hk.verifiedBy': { en: 'Checked by {{name}}', ur: '{{name}} نے جانچا' },
  'hk.cleanerNote': { en: 'Cleaner note', ur: 'صفائی والے کا نوٹ' },
  'hk.you': { en: 'you', ur: 'آپ' },
  'hk.unassigned': { en: 'Nobody yet', ur: 'ابھی کوئی نہیں' },

  'hk.selectAll': { en: 'Select all', ur: 'سب منتخب کریں' },
  'hk.assignSelected': { en: 'Assign {{count}} selected', ur: '{{count}} منتخب مقرر کریں' },
  'hk.assign': { en: 'Assign', ur: 'مقرر کریں' },
  'hk.reassign': { en: 'Change cleaner', ur: 'صفائی والا بدلیں' },
  'hk.unassign': { en: 'Take back', ur: 'واپس لیں' },
  'hk.start': { en: 'Start cleaning', ur: 'صفائی شروع' },
  'hk.markCleaned': { en: 'Mark cleaned', ur: 'صاف ہو گیا' },
  'hk.verify': { en: 'Verify & release', ur: 'تصدیق اور دستیاب کریں' },
  'hk.sendBack': { en: 'Send back', ur: 'واپس بھیجیں' },

  'hk.assignHeader': { en: 'Give to a cleaner', ur: 'صفائی والے کو دیں' },
  'hk.assignRooms': { en: 'Rooms: {{rooms}}', ur: 'کمرے: {{rooms}}' },
  'hk.cleaner': { en: "Cleaner's name", ur: 'صفائی کرنے والے کا نام' },
  'hk.cleanerPlaceholder': { en: 'Type the cleaner’s name', ur: 'صفائی کرنے والے کا نام لکھیں' },
  'hk.recentCleaners': { en: 'Recent cleaners — tap to use', ur: 'حالیہ صفائی والے — استعمال کے لیے دبائیں' },
  'hk.instructions': { en: 'Instructions (optional)', ur: 'ہدایات (اختیاری)' },
  'hk.instructionsPlaceholder': { en: 'e.g. deep clean, change linen', ur: 'مثلاً مکمل صفائی، چادریں بدلیں' },

  'hk.cleanedHeader': { en: 'Room is clean', ur: 'کمرہ صاف ہو گیا' },
  'hk.cleanedNote': { en: 'Note for the checker (optional)', ur: 'جانچنے والے کے لیے نوٹ (اختیاری)' },
  'hk.cleanedNotePlaceholder': { en: 'e.g. stain on the carpet, bulb replaced', ur: 'مثلاً قالین پر داغ، بلب بدلا' },

  'hk.rejectHeader': { en: 'Send back for re-cleaning', ur: 'دوبارہ صفائی کے لیے واپس' },
  'hk.rejectReason': { en: 'What needs fixing?', ur: 'کیا درست کرنا ہے؟' },
  'hk.rejectPlaceholder': { en: 'e.g. bathroom floor still wet', ur: 'مثلاً باتھ روم کا فرش گیلا ہے' },

  'hk.verifyHeader': { en: 'Verify this room?', ur: 'کیا اس کمرے کی تصدیق کریں؟' },
  'hk.verifyMessage': {
    en: 'Room {{room}} will become Available and can be checked into.',
    ur: 'کمرہ {{room}} دستیاب ہو جائے گا اور اس میں چیک اِن ہو سکے گا۔',
  },
  'hk.unassignHeader': { en: 'Take this room back?', ur: 'کیا یہ کمرہ واپس لیں؟' },
  'hk.unassignMessage': {
    en: 'Room {{room}} goes back to "To clean" with no cleaner.',
    ur: 'کمرہ {{room}} بغیر صفائی والے کے "صفائی باقی" میں واپس چلا جائے گا۔',
  },

  'hk.requestHeader': { en: 'Send a room for cleaning', ur: 'کمرہ صفائی کے لیے بھیجیں' },
  'hk.requestHint': {
    en: 'Only available rooms are listed. The room is blocked from check-in until it is cleaned and verified.',
    ur: 'صرف دستیاب کمرے دکھائے گئے ہیں۔ صفائی اور تصدیق تک کمرے میں چیک اِن بند رہے گا۔',
  },
  'hk.room': { en: 'Room', ur: 'کمرہ' },
  'hk.roomPlaceholder': { en: 'Choose a room', ur: 'کمرہ منتخب کریں' },
  'hk.reason': { en: 'Reason (optional)', ur: 'وجہ (اختیاری)' },
  'hk.reasonPlaceholder': { en: 'e.g. guest request, spot check', ur: 'مثلاً مہمان کی درخواست، معائنہ' },
  'hk.send': { en: 'Send for cleaning', ur: 'صفائی کے لیے بھیجیں' },

  'hk.emptyTodo': { en: 'Nothing waiting', ur: 'کچھ باقی نہیں' },
  'hk.emptyWorking': { en: 'No one is cleaning', ur: 'کوئی صفائی نہیں کر رہا' },
  'hk.emptyReview': { en: 'Nothing to verify', ur: 'جانچنے کو کچھ نہیں' },
  'hk.emptyDone': { en: 'No rooms released yet today', ur: 'آج ابھی کوئی کمرہ جاری نہیں ہوا' },
  'hk.allClearTitle': { en: 'All rooms are clean', ur: 'تمام کمرے صاف ہیں' },
  'hk.allClearDescription': {
    en: 'Rooms appear here automatically after a check-out or transfer.',
    ur: 'چیک آؤٹ یا منتقلی کے بعد کمرے یہاں خود بخود نظر آتے ہیں۔',
  },

  'hk.toast.assigned': { en: 'Assigned', ur: 'مقرر کر دیا' },
  'hk.toast.assignedDetail': { en: '{{count}} room(s) given to {{name}}.', ur: '{{count}} کمرے {{name}} کو دیے گئے۔' },
  'hk.toast.started': { en: 'Cleaning started', ur: 'صفائی شروع' },
  'hk.toast.cleaned': { en: 'Sent for checking', ur: 'جانچ کے لیے بھیج دیا' },
  'hk.toast.cleanedDetail': { en: 'Room {{room}} is waiting for verification.', ur: 'کمرہ {{room}} تصدیق کا منتظر ہے۔' },
  'hk.toast.verified': { en: 'Room is available', ur: 'کمرہ دستیاب ہے' },
  'hk.toast.verifiedDetail': { en: 'Room {{room}} can be checked into again.', ur: 'کمرہ {{room}} میں دوبارہ چیک اِن ہو سکتا ہے۔' },
  'hk.toast.sentBack': { en: 'Sent back to the cleaner', ur: 'صفائی والے کو واپس بھیج دیا' },
  'hk.toast.unassigned': { en: 'Room taken back', ur: 'کمرہ واپس لے لیا' },
  'hk.toast.requested': { en: 'Room sent for cleaning', ur: 'کمرہ صفائی کے لیے بھیج دیا' },

  'hk.time.min': { en: '{{n}} min', ur: '{{n}} منٹ' },
  'hk.time.hour': { en: '{{n}} h', ur: '{{n}} گھنٹے' },
  'hk.time.day': { en: '{{n}} d', ur: '{{n}} دن' },
  'hk.time.now': { en: 'just now', ur: 'ابھی' },
};
