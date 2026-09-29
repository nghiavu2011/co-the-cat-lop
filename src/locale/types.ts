export type Locale = 'vi' | 'en';

export interface LocaleStrings {
  [key: string]: string | LocaleStrings;
}
