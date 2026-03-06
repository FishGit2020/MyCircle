import { useTranslation, PageContent } from '@mycircle/shared';
import type { TranslationKey } from '@mycircle/shared';

const SECTIONS: { titleKey: TranslationKey; textKey: TranslationKey }[] = [
  { titleKey: 'privacy.introTitle', textKey: 'privacy.introText' },
  { titleKey: 'privacy.collectTitle', textKey: 'privacy.collectText' },
  { titleKey: 'privacy.useTitle', textKey: 'privacy.useText' },
  { titleKey: 'privacy.sharingTitle', textKey: 'privacy.sharingText' },
  { titleKey: 'privacy.securityTitle', textKey: 'privacy.securityText' },
  { titleKey: 'privacy.dataProvidersTitle', textKey: 'privacy.dataProvidersText' },
  { titleKey: 'privacy.contactTitle', textKey: 'privacy.contactText' },
];

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <PageContent maxWidth="3xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t('privacy.title')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {t('privacy.lastUpdated')}
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
    </PageContent>
  );
}
