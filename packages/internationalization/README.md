# Internationalization Package

This package provides internationalization (i18n) capabilities for Next.js applications in the project. It combines multiple internationalization libraries to provide a comprehensive solution for multi-language support.

## Features

- **Multiple Locale Support**: Currently supports English (en), Turkish (tr), Spanish (es), and German (de)
- **Automatic Locale Detection**: Detects user's preferred language from browser settings
- **URL-based Locale Switching**: Supports locale prefixes in URLs (e.g., `/en/about`, `/tr/about`)
- **Server and Client Components Support**: Works with both server and client components
- **Type-Safe Translations**: Provides TypeScript types for translations
- **Fallback Mechanism**: Falls back to English when translations are missing

## Installation

This package is part of the monorepo and can be used by adding it to your application's dependencies:

```json
{
  "dependencies": {
    "@repo/internationalization": "workspace:*"
  }
}
```

## Usage

### Middleware Setup

To enable internationalization in your Next.js application, add the middleware to your `middleware.ts` file:

```typescript
import { internationalizationMiddleware } from '@repo/internationalization/middleware';
import { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return internationalizationMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Server Components

For server components, use the `getDictionary` function to load translations:

```typescript
import { getDictionary } from '@repo/internationalization';

// In a server component or page
const ServerComponent = async ({ params }: { params: { locale: string } }) => {
  const { locale } = params;
  const dictionary = await getDictionary(locale);

  return (
    <div>
      <h1>{dictionary.web.header.home}</h1>
      {/* Use dictionary entries for other translations */}
    </div>
  );
};
```

### Client Components

For client components, use the `TranslationProvider` and `useTranslation` hook:

1. First, wrap your client components with the `TranslationProvider`:

```typescript
// In a server component that renders client components
import { getDictionary } from '@repo/internationalization';
import { TranslationProvider } from '@repo/internationalization/TranslationProvider';
import ClientComponent from './ClientComponent';

const ServerComponent = async ({ params }: { params: { locale: string } }) => {
  const { locale } = params;
  const dictionary = await getDictionary(locale);

  return (
    <TranslationProvider locale={locale} messages={dictionary}>
      <ClientComponent />
    </TranslationProvider>
  );
};
```

2. Then, use the `useTranslation` hook in your client components:

```typescript
'use client';

import { useTranslation } from '@repo/internationalization/useTranslation';

const ClientComponent = () => {
  const { t } = useTranslation('web');

  return (
    <div>
      <h1>{t('header.home')}</h1>
      <p>{t('header.product.description')}</p>
    </div>
  );
};
```

## Configuration

### Supported Locales

The supported locales are defined in multiple configuration files:

1. `languine.json` - Main configuration for translation management:
```json
{
  "locale": {
    "source": "en",
    "targets": ["es", "de", "tr"]
  },
  "files": {
    "json": {
      "include": ["dictionaries/[locale].json"]
    }
  }
}
```

2. `i18nConfig.ts` - Configuration for Next.js internationalization:
```typescript
export const i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'tr', 'es', 'de'],
  localePrefix: 'as-needed'
}
```

### Adding a New Locale

To add a new locale:

1. Add the locale code to `languine.json` in the `targets` array
2. Add the locale code to `i18nConfig.ts` in the `locales` array
3. Create a new translation file in the `dictionaries` directory (e.g., `dictionaries/fr.json`)
4. Create a new translation file in the `locales` directory (e.g., `locales/fr.json`)

### Translation Files

The package uses two sets of translation files:

1. **Dictionaries**: Located in the `dictionaries` directory, these contain comprehensive translations for the web application
2. **Locales**: Located in the `locales` directory, these contain simple translations for common phrases

## Translation Management

This package uses [Languine](https://github.com/inlang/languine) for translation management. To update translations:

```bash
npm run translate
```

This will update the translation files based on the source locale (English).

## API Reference

### `getDictionary(locale: string): Promise<Dictionary>`

Loads the dictionary for the specified locale. Falls back to English if the locale is not supported or the dictionary fails to load.

### `useTranslation(namespace: string): { t: (key: string) => string }`

React hook for accessing translations in client components. The `namespace` parameter specifies which part of the translation object to use.

### `TranslationProvider({ children, locale, messages })`

React component that provides translations to client components.

### `internationalizationMiddleware(request: NextRequest)`

Next.js middleware function that handles locale detection and URL-based locale switching.

## Internal Architecture

The package uses:

- `next-international` for middleware and URL-based locale switching
- `next-intl` for client-side translations
- `@formatjs/intl-localematcher` for locale detection based on browser preferences

## Troubleshooting

### Missing Translations

If translations are missing for a specific locale, the package will fall back to English. Check the console for warnings about missing translations.

### Adding New Translation Keys

When adding new translation keys, make sure to add them to all locale files to maintain consistency.
