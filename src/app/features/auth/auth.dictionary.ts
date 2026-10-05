import type { DictionaryEntry } from '../../core/i18n/translation.service';

export const AUTH_DICTIONARY: Record<string, DictionaryEntry> = {
  'auth.login.title': { en: 'Welcome back', ur: 'خوش آمدید' },
  'auth.login.subtitle': { en: 'Sign in to continue to Management.', ur: 'انتظام جاری رکھنے کے لیے سائن ان کریں۔' },
  'auth.login.submit': { en: 'Sign in', ur: 'سائن ان کریں' },
  'auth.login.noAccount': { en: 'Need an account?', ur: 'اکاؤنٹ درکار ہے؟' },
  'auth.login.registerLink': { en: 'Register', ur: 'رجسٹر کریں' },
  'auth.login.failedSummary': { en: 'Sign in failed', ur: 'سائن ان ناکام' },
  'auth.login.failedDetail': { en: 'Check your email and password.', ur: 'اپنا ای میل اور پاس ورڈ چیک کریں۔' },

  'auth.register.title': { en: 'Create account', ur: 'اکاؤنٹ بنائیں' },
  'auth.register.subtitle': {
    en: 'Register when your API allows bootstrap sign-up.',
    ur: 'جب آپ کا API ابتدائی سائن اپ کی اجازت دے تو رجسٹر کریں۔',
  },
  'auth.register.submit': { en: 'Create account', ur: 'اکاؤنٹ بنائیں' },
  'auth.register.haveAccount': { en: 'Already have an account?', ur: 'پہلے سے اکاؤنٹ ہے؟' },
  'auth.register.signInLink': { en: 'Sign in', ur: 'سائن ان کریں' },
  'auth.register.failedSummary': { en: 'Registration failed', ur: 'رجسٹریشن ناکام' },
  'auth.register.failedDetail': {
    en: 'Could not create your account. Try a different email.',
    ur: 'آپ کا اکاؤنٹ نہیں بن سکا۔ ایک مختلف ای میل آزمائیں۔',
  },
};
