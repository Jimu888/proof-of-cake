'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Language = 'en' | 'zh';
type Translate = (english: string, chinese: string) => string;

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({ language: 'en', setLanguage: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>('en');

  useEffect(() => {
    try {
      if (localStorage.getItem('mement-lang') === 'zh') updateLanguage('zh');
    } catch { /* Storage can be blocked. */ }
  }, []);

  function setLanguage(next: Language) {
    updateLanguage(next);
    try { localStorage.setItem('mement-lang', next); }
    catch { /* The current tab can still switch languages. */ }
  }

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const { language, setLanguage } = useContext(LanguageContext);
  const t: Translate = (english, chinese) => language === 'zh' ? chinese : english;
  return { language, setLanguage, t, locale: language === 'zh' ? 'zh-CN' : 'en' };
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  return <div className="language-switch" role="group" aria-label={t('Language', '语言')}>
    <button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    <span aria-hidden="true">/</span>
    <button type="button" lang="zh-CN" aria-label="中文" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button>
  </div>;
}

export function LocalText({ en, zh }: { en: string; zh: string }) {
  const { t, locale } = useLanguage();
  return <span lang={locale}>{t(en, zh)}</span>;
}
