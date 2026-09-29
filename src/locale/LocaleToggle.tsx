import { useLocale } from './useLocale';

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      type="button"
      className="localeToggleBtn"
      onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
      title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
      aria-label="Toggle language"
    >
      <span className="localeIcon">{locale === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
      <span className="localeLabel">{locale === 'vi' ? 'VI' : 'EN'}</span>
    </button>
  );
}
