import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const AUDIT_DICTIONARY: Record<string, DictionaryEntry> = {
  'audit.subtitle': { en: 'Administrative audit trail (API: /audit-logs).', ur: 'انتظامی آڈٹ ٹریل (API: /audit-logs)۔' },
  'audit.emptyTitle': { en: 'No entries', ur: 'کوئی اندراج نہیں' },
  'audit.emptyDescription': { en: 'No audit records returned.', ur: 'کوئی آڈٹ ریکارڈ موصول نہیں ہوا۔' },
  'audit.when': { en: 'When', ur: 'کب' },
  'audit.action': { en: 'Action', ur: 'عمل' },
  'audit.resource': { en: 'Resource', ur: 'وسیلہ' },
  'audit.user': { en: 'User', ur: 'صارف' },
};
