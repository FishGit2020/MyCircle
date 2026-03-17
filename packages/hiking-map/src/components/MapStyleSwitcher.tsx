import { useTranslation } from '@mycircle/shared';
import type { TileProviderConfig } from '../config/mapConfig';

interface Props {
  providers: TileProviderConfig[];
  activeId: string;
  onChange: (id: string, style: string | Record<string, unknown>) => void;
}

export default function MapStyleSwitcher({ providers, activeId, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">{t('hiking.mapStyle')}</p>
      {providers.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={activeId === p.id}
          onClick={() => onChange(p.id, p.style)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition text-left
            ${activeId === p.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          {t(p.labelKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      ))}
    </div>
  );
}
