import { useTranslation } from '@mycircle/shared';

interface OllamaRunningModel {
  name: string;
  size: number;
  sizeVram: number;
  expiresAt: string;
}

interface OllamaStatus {
  models: OllamaRunningModel[];
  reachable: boolean;
  latencyMs: number | null;
}

interface Props {
  status?: OllamaStatus;
}

export default function MonitorOllamaStatus({ status }: Props) {
  const { t } = useTranslation();

  if (!status) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-2.5 h-2.5 rounded-full ${status.reachable ? 'bg-green-400' : 'bg-red-400'}`}
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {t('ai.monitor.ollamaStatus')}
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
            {status.reachable ? t('ai.monitor.online') : t('ai.monitor.offline')}
            {status.latencyMs != null && ` (${status.latencyMs}ms)`}
          </span>
        </p>
      </div>

      {status.models.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('ai.monitor.noModels')}</p>
      ) : (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('ai.monitor.runningModels')}</p>
          <div className="space-y-2">
            {status.models.map(m => (
              <div key={m.name} className="flex items-center justify-between text-sm">
                <span className="font-mono text-gray-700 dark:text-gray-200">{m.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {m.size.toFixed(1)} GB
                  {m.sizeVram > 0 && (
                    <> &middot; {t('ai.monitor.vram')}: {m.sizeVram.toFixed(1)} GB</>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
