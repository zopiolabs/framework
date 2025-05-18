# Internationalization Code Examples

This directory contains practical code examples for implementing internationalization in various scenarios. Each example demonstrates best practices and common patterns.

## Available Examples

1. [Basic Server Component](#basic-server-component)
2. [Client Component with Translation](#client-component-with-translation)
3. [Language Switcher](#language-switcher)
4. [Date and Number Formatting](#date-and-number-formatting)
5. [Dynamic Translation Keys](#dynamic-translation-keys)
6. [Form Validation Messages](#form-validation-messages)

## Basic Server Component

```tsx
// app/[locale]/page.tsx
import { getDictionary } from '@repo/internationalization';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const dictionary = await getDictionary(params.locale);
  
  return (
    <div>
      <h1>{dictionary.web.home.meta.title}</h1>
      <p>{dictionary.web.home.meta.description}</p>
      
      <div className="hero">
        <p>{dictionary.web.home.hero.announcement}</p>
      </div>
      
      <div className="features">
        <h2>{dictionary.web.home.features.title}</h2>
        <p>{dictionary.web.home.features.description}</p>
        
        {dictionary.web.home.features.items.map((item, index) => (
          <div key={index} className="feature-item">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Client Component with Translation

```tsx
// components/ContactForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@repo/internationalization/useTranslation';

export default function ContactForm() {
  const { t } = useTranslation('web.contact.form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic
    console.log('Form submitted:', formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">{t('name')}</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t('namePlaceholder')}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">{t('email')}</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t('emailPlaceholder')}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="message">{t('message')}</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder={t('messagePlaceholder')}
          required
        ></textarea>
      </div>
      
      <button type="submit">{t('submit')}</button>
    </form>
  );
}

// app/[locale]/contact/page.tsx
import { getDictionary } from '@repo/internationalization';
import { TranslationProvider } from '@repo/internationalization/TranslationProvider';
import ContactForm from '@/components/ContactForm';

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const dictionary = await getDictionary(params.locale);
  
  return (
    <div>
      <h1>{dictionary.web.contact.title}</h1>
      <p>{dictionary.web.contact.description}</p>
      
      <TranslationProvider locale={params.locale} messages={dictionary}>
        <ContactForm />
      </TranslationProvider>
    </div>
  );
}
```

## Language Switcher

```tsx
// components/LanguageSwitcher.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { i18nConfig } from '@repo/internationalization/i18nConfig';

// Map of locale codes to their display names
const localeNames: Record<string, string> = {
  en: 'English',
  tr: 'Türkçe',
  es: 'Español',
  de: 'Deutsch'
};

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
      <span className="language-label">Language:</span>
      <ul className="language-list">
        {i18nConfig.locales.map((locale) => (
          <li key={locale}>
            <Link 
              href={getLocalePath(locale)}
              className={pathname.startsWith(`/${locale}/`) ? 'active' : ''}
            >
              {localeNames[locale] || locale.toUpperCase()}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Usage in layout
// app/[locale]/layout.tsx
import { getDictionary } from '@repo/internationalization';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function Layout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: { locale: string };
}) {
  const dictionary = await getDictionary(params.locale);
  
  return (
    <html lang={params.locale}>
      <body>
        <header>
          <nav>
            {/* Navigation items */}
            <LanguageSwitcher />
          </nav>
        </header>
        <main>{children}</main>
        <footer>{/* Footer content */}</footer>
      </body>
    </html>
  );
}
```

## Date and Number Formatting

```tsx
// components/LocalizedDateTime.tsx
'use client';

import { useTranslation } from '@repo/internationalization/useTranslation';
import { useParams } from 'next/navigation';

export default function LocalizedDateTime() {
  const { t } = useTranslation('web');
  const { locale } = useParams();
  const now = new Date();
  
  // Format date according to the current locale
  const formattedDate = new Intl.DateTimeFormat(locale as string, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(now);
  
  // Format number according to the current locale
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale as string).format(num);
  };
  
  return (
    <div className="localized-content">
      <p>{t('today', { date: formattedDate })}</p>
      <p>
        {t('price', { 
          price: formatNumber(1299.99),
          currency: locale === 'tr' ? '₺' : locale === 'de' ? '€' : '$'
        })}
      </p>
    </div>
  );
}
```

## Dynamic Translation Keys

```tsx
// components/DynamicContent.tsx
'use client';

import { useTranslation } from '@repo/internationalization/useTranslation';

type DynamicContentProps = {
  section: 'features' | 'testimonials' | 'faq';
  itemIndex?: number;
};

export default function DynamicContent({ section, itemIndex }: DynamicContentProps) {
  const { t } = useTranslation('web.home');
  
  // Dynamically access nested translation keys
  const title = t(`${section}.title`);
  const description = t(`${section}.description`);
  
  // For accessing specific items in an array
  const renderItem = () => {
    if (itemIndex !== undefined) {
      const itemKey = `${section}.items.${itemIndex}`;
      
      switch (section) {
        case 'features':
          return (
            <div className="feature">
              <h3>{t(`${itemKey}.title`)}</h3>
              <p>{t(`${itemKey}.description`)}</p>
            </div>
          );
        case 'testimonials':
          return (
            <div className="testimonial">
              <blockquote>{t(`${itemKey}.quote`)}</blockquote>
              <cite>
                {t(`${itemKey}.author`)}, {t(`${itemKey}.role`)}
              </cite>
            </div>
          );
        case 'faq':
          return (
            <div className="faq-item">
              <h3>{t(`${itemKey}.question`)}</h3>
              <p>{t(`${itemKey}.answer`)}</p>
            </div>
          );
        default:
          return null;
      }
    }
    
    return null;
  };
  
  return (
    <div className="dynamic-content">
      <h2>{title}</h2>
      <p>{description}</p>
      {itemIndex !== undefined && renderItem()}
    </div>
  );
}
```

## Form Validation Messages

```tsx
// components/ValidatedForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@repo/internationalization/useTranslation';

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export default function ValidatedForm() {
  const { t } = useTranslation('web.form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  
  const validate = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.name) {
      newErrors.name = t('errors.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('errors.nameLength');
    }
    
    if (!formData.email) {
      newErrors.email = t('errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('errors.passwordLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      // Form submission logic
      console.log('Form submitted:', formData);
      alert(t('submitSuccess'));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="validated-form">
      <div className="form-group">
        <label htmlFor="name">{t('name')}</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">{t('email')}</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="password">{t('password')}</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <button type="submit">{t('submit')}</button>
    </form>
  );
}
```
