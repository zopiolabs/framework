import { useTranslations as useNextIntlTranslations } from 'next-intl';

/**
 * Type for translation parameters
 */
export type TranslationParams = Record<string, string | number | boolean | Date | null | undefined>;

/**
 * Hook for using translations in view components
 * @param namespace Optional namespace for translations
 * @returns Translation function
 */
export function useViewTranslations(namespace = 'view') {
  // Use next-intl for translations
  const nextIntlTranslate = useNextIntlTranslations(namespace);
  
  /**
   * Translate a key with optional parameters
   * @param key Translation key
   * @param params Optional parameters for the translation
   * @param defaultValue Default value if the translation is not found
   * @returns Translated string
   */
  const translate = (
    key: string,
    params?: TranslationParams,
    defaultValue?: string
  ): string => {
    try {
      // Try to get the translation from next-intl
      return nextIntlTranslate(key, params as Record<string, unknown>);
    } catch (error) {
      // If the translation is not found, return the default value or the key
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      
      // If no default value is provided, return the key
      return key.split('.').pop() || key;
    }
  };
  
  return translate;
}

/**
 * Server-side translation function
 * @param locale Locale to use for translation
 * @param namespace Namespace for translations
 * @param key Translation key
 * @param params Optional parameters for the translation
 * @param defaultValue Default value if the translation is not found
 * @returns Translated string
 */
export async function translateServer(
  locale: string,
  namespace: string,
  key: string,
  params?: TranslationParams,
  defaultValue?: string
): Promise<string> {
  try {
    // Import the messages for the locale and namespace
    const messages = await import(`../../locales/${locale}/${namespace}.json`)
      .then(module => module.default as Record<string, unknown>)
      .catch(() => ({}) as Record<string, unknown>);
    
    // Get the translation using the key path
    let translation = key.split('.').reduce<Record<string, unknown> | string | undefined>(
      (obj, k) => (obj && typeof obj === 'object' ? (obj[k] as Record<string, unknown> | string | undefined) : undefined),
      messages
    );
    
    // If the translation is a string and params are provided, replace placeholders
    if (typeof translation === 'string' && params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        translation = translation.replace(
          new RegExp(`{${paramKey}}`, 'g'),
          String(paramValue ?? '')
        );
      }
    }
    
    // Return the translation or default value or key
    return typeof translation === 'string'
      ? translation
      : defaultValue !== undefined
      ? defaultValue
      : key.split('.').pop() || key;
  } catch (error) {
    // If an error occurs, return the default value or the key
    return defaultValue !== undefined
      ? defaultValue
      : key.split('.').pop() || key;
  }
}

/**
 * Get a translation function for a specific locale and namespace
 * @param locale Locale to use for translation
 * @param namespace Namespace for translations
 * @returns Translation function
 */
export function getTranslator(locale: string, namespace = 'view') {
  return (key: string, params?: TranslationParams, defaultValue?: string) =>
    translateServer(locale, namespace, key, params, defaultValue);
}
