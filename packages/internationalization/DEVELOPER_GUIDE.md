# Internationalization Developer Guide

This guide provides detailed instructions and best practices for working with the internationalization package in this project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Common Usage Patterns](#common-usage-patterns)
4. [Advanced Usage](#advanced-usage)
5. [Testing Translations](#testing-translations)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Understanding the Basics

The internationalization package in this project provides a way to support multiple languages in your application. It handles:

- Detecting the user's preferred language
- Loading the appropriate translations
- Displaying content in the selected language
- Allowing users to switch languages

### Key Components

- **Middleware**: Handles locale detection and URL-based locale switching
- **Dictionary**: Contains translations for all supported languages
- **TranslationProvider**: Provides translations to client components
- **useTranslation hook**: Allows client components to access translations

## Project Structure

```
internationalization/
├── dictionaries/       # Contains comprehensive translations for each locale
│   ├── en.json         # English translations (source)
│   ├── tr.json         # Turkish translations
│   ├── es.json         # Spanish translations
│   └── de.json         # German translations
├── locales/            # Contains simple translations for common phrases
│   ├── en.json
│   ├── tr.json
│   ├── es.json
│   └── de.json
├── TranslationProvider.tsx  # Provider for client components
├── getDictionary.ts    # Function to load dictionary for server components
├── i18nConfig.ts       # Configuration for Next.js internationalization
├── index.ts           # Main entry point and exports
├── languine.json      # Configuration for translation management
├── middleware.ts      # Next.js middleware for internationalization
└── useTranslation.ts  # Hook for client components
```

## Common Usage Patterns

### 1. Setting Up a New Page with Internationalization

For a new page that needs internationalization support:

```typescript
// app/[locale]/example/page.tsx
import { getDictionary } from '@repo/internationalization';

export default async function ExamplePage({ params }: { params: { locale: string } }) {
  const dictionary = await getDictionary(params.locale);
  
  return (
    <div>
      <h1>{dictionary.web.header.home}</h1>
      <p>{dictionary.web.home.meta.description}</p>
    </div>
  );
}
```

### 2. Creating a Multilingual Form

For forms that need to be translated:

```typescript
// Server Component
import { getDictionary } from '@repo/internationalization';
import { TranslationProvider } from '@repo/internationalization/TranslationProvider';
import ContactForm from './ContactForm'; // Client component

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const dictionary = await getDictionary(params.locale);
  
  return (
    <div>
      <h1>{dictionary.web.contact.title}</h1>
      <TranslationProvider locale={params.locale} messages={dictionary}>
        <ContactForm />
      </TranslationProvider>
    </div>
  );
}

// Client Component (ContactForm.tsx)
'use client';

import { useTranslation } from '@repo/internationalization/useTranslation';

export default function ContactForm() {
  const { t } = useTranslation('web.contact.form');
  
  return (
    <form>
      <label>{t('name')}</label>
      <input type="text" placeholder={t('namePlaceholder')} />
      
      <label>{t('email')}</label>
      <input type="email" placeholder={t('emailPlaceholder')} />
      
      <label>{t('message')}</label>
      <textarea placeholder={t('messagePlaceholder')}></textarea>
      
      <button type="submit">{t('submit')}</button>
    </form>
  );
}
```

### 3. Language Switcher Component

To allow users to switch languages:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { i18nConfig } from '@repo/internationalization/i18nConfig';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  
  // Function to get the path for a different locale
  const getLocalePath = (locale: string) => {
    const segments = pathname.split('/');
    const currentLocale = segments[1];
    
    // Check if the current path already has a locale
    if (i18nConfig.locales.includes(currentLocale)) {
      segments[1] = locale;
      return segments.join('/');
    }
    
    // If no locale in the path, add it
    return `/${locale}${pathname}`;
  };
  
  return (
    <div className="language-switcher">
      {i18nConfig.locales.map((locale) => (
        <Link 
          key={locale} 
          href={getLocalePath(locale)}
          className="language-link"
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
```

## Advanced Usage

### 1. Dynamic Translation Keys

For dynamic translation keys:

```typescript
'use client';

import { useTranslation } from '@repo/internationalization/useTranslation';

export default function DynamicComponent({ section }: { section: string }) {
  const { t } = useTranslation('web');
  
  // Dynamically access nested translation keys
  const title = t(`${section}.title`);
  const description = t(`${section}.description`);
  
  return (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
```

### 2. Formatting Dates and Numbers

For formatting dates and numbers according to the locale:

```typescript
'use client';

import { useTranslation } from '@repo/internationalization/useTranslation';

export default function LocalizedDateTime() {
  const { t } = useTranslation('web');
  const now = new Date();
  
  // Format date according to the current locale
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(now);
  
  return (
    <div>
      <p>{t('today', { date: formattedDate })}</p>
    </div>
  );
}
```

### 3. Handling Pluralization

For handling pluralization in translations:

```typescript
// In your translation file (e.g., en.json)
{
  "items": {
    "zero": "No items",
    "one": "One item",
    "other": "{count} items"
  }
}

// In your component
'use client';

import { useTranslation } from '@repo/internationalization/useTranslation';

export default function ItemsList({ count }: { count: number }) {
  const { t } = useTranslation('web');
  
  return (
    <div>
      <p>{t('items', { count })}</p>
    </div>
  );
}
```

## Testing Translations

### 1. Manual Testing

To manually test translations:

1. Start your development server
2. Navigate to different locales by changing the URL (e.g., `/en/about` to `/tr/about`)
3. Verify that the content is correctly translated

### 2. Automated Testing

For automated testing of translations:

```typescript
// __tests__/internationalization.test.ts
import { getDictionary } from '@repo/internationalization';

describe('Internationalization', () => {
  test('English dictionary loads correctly', async () => {
    const dictionary = await getDictionary('en');
    expect(dictionary).toBeDefined();
    expect(dictionary.web.header.home).toBe('Home');
  });
  
  test('Turkish dictionary loads correctly', async () => {
    const dictionary = await getDictionary('tr');
    expect(dictionary).toBeDefined();
    expect(dictionary.web.header.home).toBe('Ana Sayfa');
  });
  
  test('Falls back to English for unsupported locale', async () => {
    const dictionary = await getDictionary('xx');
    expect(dictionary).toBeDefined();
    expect(dictionary.web.header.home).toBe('Home');
  });
});
```

## Troubleshooting

### Common Issues and Solutions

1. **Missing Translation Keys**

   **Problem**: You see the translation key instead of the translated text.
   
   **Solution**: Check if the translation key exists in all locale files. Add the missing key to the appropriate locale file.

2. **Locale Not Detected**

   **Problem**: The application always uses the default locale.
   
   **Solution**: Check the middleware configuration and ensure the locale detection is working correctly.

3. **Client Component Translation Not Working**

   **Problem**: Translations work in server components but not in client components.
   
   **Solution**: Ensure the client component is wrapped with the `TranslationProvider` and is using the `useTranslation` hook correctly.

4. **TypeScript Errors with Translation Keys**

   **Problem**: TypeScript complains about unknown translation keys.
   
   **Solution**: Make sure your Dictionary type is correctly defined and exported. Consider using a type-safe translation library or generating types from your translation files.

### Debugging Tips

1. Add console logs to check which locale is being detected and used
2. Verify that the translation files are being loaded correctly
3. Check the browser's network tab to ensure the correct locale files are being requested
4. Use the React DevTools to inspect the TranslationProvider props and context values
