import { useTranslation } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';

interface Props {
  map: maplibregl.Map | null;
}

export default function ZoomControls({ map }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-600">
      <button
        type="button"
        onClick={() => map?.zoomIn()}
        disabled={!map}
        aria-label={t('hiking.zoomIn')}
        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 text-xl font-light border-b border-gray-200 dark:border-gray-600 transition select-none"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => map?.zoomOut()}
        disabled={!map}
        aria-label={t('hiking.zoomOut')}
        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 text-2xl font-light transition select-none"
      >
        −
      </button>
    </div>
  );
}
