import { useTranslation, EndpointManager } from '@mycircle/shared';

export default function EndpointSection() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('setup.endpoints.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('setup.endpoints.description')}
        </p>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
        {t('setup.endpoints.manageHint')}
      </div>

      <EndpointManager source="chat" />
    </div>
  );
}
