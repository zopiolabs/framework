export default function componentTemplate(name, options = {}) {
  const { withI18n = false } = options;
  
  if (withI18n) {
    return `'use client';

import { useTranslations } from 'next-intl';

export default function ${name}({ className }) {
  const t = useTranslations('${name.toLowerCase()}');
  
  return (
    <div className={className}>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </div>
  );
}
`;
  }
  
  return `'use client';

export default function ${name}({ className }) {
  return (
    <div className={className}>
      <h2>${name}</h2>
      <p>Description goes here</p>
    </div>
  );
}
`;
}
