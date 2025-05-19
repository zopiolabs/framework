export default function i18nConfigTemplate(options = {}) {
  const { defaultLocale = 'en', locales = ['en', 'tr', 'es', 'de'] } = options;
  
  return `export const i18nConfig = {
  defaultLocale: '${defaultLocale}',
  locales: ${JSON.stringify(locales)},
  localeDetection: true
};
`;
}
