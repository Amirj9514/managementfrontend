import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { COMMON_DICTIONARY } from './dictionaries/common.dictionary';
import { NAV_DICTIONARY } from './dictionaries/nav.dictionary';

export type AppLang = 'en' | 'ur';

export interface DictionaryEntry {
  en: string;
  ur: string;
}

const STORAGE_KEY = 'app.lang';

/**
 * Runtime (not build-time) translation service — the app ships one bundle and switches
 * language instantly via a signal, rather than Angular's build-time $localize approach which
 * would need a separate compiled bundle per locale and a full page reload to switch.
 *
 * Feature areas register their own strings lazily (when their route/component first loads) via
 * `register()`, so no single giant shared dictionary file has to be edited by every feature —
 * each feature owns and ships its own English+Urdu pairs alongside its component.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly dictionaries: Record<AppLang, Record<string, string>> = { en: {}, ur: {} };

  readonly currentLang = signal<AppLang>(this.loadInitialLang());

  /** Fired whenever the language changes — the (impure) TranslatePipe subscribes to this and
   *  calls markForCheck() on its host view, since OnPush components don't otherwise know a
   *  signal read *inside* a pipe's transform() changed. */
  readonly langChanged$ = new Subject<void>();

  constructor() {
    this.register(COMMON_DICTIONARY);
    this.register(NAV_DICTIONARY);
    this.applyDocumentAttributes(this.currentLang());
  }

  /** Merges a feature's {key: {en, ur}} strings into the global lookup. Safe to call more than
   *  once (e.g. every time a lazy-loaded component is instantiated) — it's just an overwrite. */
  register(dict: Record<string, DictionaryEntry>): void {
    for (const [key, entry] of Object.entries(dict)) {
      this.dictionaries.en[key] = entry.en;
      this.dictionaries.ur[key] = entry.ur;
    }
  }

  /** Looks up `key` in the active language, falling back to English, then to the raw key
   *  itself (so a missing translation is visibly obvious instead of silently blank). */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLang();
    let value = this.dictionaries[lang][key] ?? this.dictionaries.en[key] ?? key;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(`{{${paramKey}}}`, String(paramValue));
      }
    }
    return value;
  }

  setLang(lang: AppLang): void {
    if (this.currentLang() === lang) return;
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyDocumentAttributes(lang);
    this.langChanged$.next();
  }

  toggleLang(): void {
    this.setLang(this.currentLang() === 'en' ? 'ur' : 'en');
  }

  private applyDocumentAttributes(lang: AppLang): void {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }

  private loadInitialLang(): AppLang {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'ur' ? 'ur' : 'en';
    } catch {
      return 'en';
    }
  }
}
