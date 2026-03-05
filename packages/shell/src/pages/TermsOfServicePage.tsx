import { useTranslation } from '@mycircle/shared';
import type { TranslationKey } from '@mycircle/shared';

const SECTIONS: { titleKey: TranslationKey; textKey: TranslationKey }[] = [
  { titleKey: 'terms.introTitle', textKey: 'terms.introText' },
  { titleKey: 'terms.useTitle', textKey: 'terms.useText' },
  { titleKey: 'terms.accountsTitle', textKey: 'terms.accountsText' },
  { titleKey: 'terms.contentTitle', textKey: 'terms.contentText' },
  { titleKey: 'terms.disclaimerTitle', textKey: 'terms.disclaimerText' },
  { titleKey: 'terms.limitationTitle', textKey: 'terms.limitationText' },
  { titleKey: 'terms.contactTitle', textKey: 'terms.contactText' },
];

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t('terms.title')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {t('terms.lastUpdated')}
      </p>

      <div className="space-y-6">
        {SECTIONS.map(({ titleKey, textKey }) => (
          <section key={titleKey}>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t(titleKey)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t(textKey)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
