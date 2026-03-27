import { useTranslation } from '@mycircle/shared';

interface ElevationPoint {
  distanceM: number;
  elevationM: number;
}

interface Props {
  profile: ElevationPoint[];
  totalGainM: number;
  totalLossM: number;
  distanceLabel: string;
}

export default function ElevationProfile({ profile, totalGainM, totalLossM, distanceLabel }: Props) {
  const { t } = useTranslation();

  if (profile.length < 2) return null;

  const W = 300;
  const H = 80;
  const PAD = { top: 6, right: 8, bottom: 20, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxDist = profile[profile.length - 1].distanceM;
  const elevs = profile.map(p => p.elevationM);
  const minElev = Math.min(...elevs);
  const maxElev = Math.max(...elevs);
  const elevRange = maxElev - minElev || 1;

  const toX = (d: number) => PAD.left + (d / maxDist) * innerW;
  const toY = (e: number) => PAD.top + innerH - ((e - minElev) / elevRange) * innerH;

  const pts = profile.map(p => `${toX(p.distanceM).toFixed(1)},${toY(p.elevationM).toFixed(1)}`).join(' ');
  // Close path to baseline for filled area
  const fillPath = `M ${toX(0)},${PAD.top + innerH} L ${pts.replace(/(\S+),(\S+)/g, 'L $1,$2').replace('L ', '')} L ${toX(maxDist)},${PAD.top + innerH} Z`;

  const midDist = maxDist / 2;
  const midElev = profile.reduce((prev, curr) =>
    Math.abs(curr.distanceM - midDist) < Math.abs(prev.distanceM - midDist) ? curr : prev
  ).elevationM;

  return (
    <div className="mt-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        aria-label={t('hiking.elevationProfile')}
        className="block"
      >
        {/* Fill */}
        <path d={fillPath} className="fill-blue-100 dark:fill-blue-900/30" />

        {/* Line */}
        <polyline
          points={pts}
          className="stroke-blue-500 dark:stroke-blue-400"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />

        {/* Y-axis labels */}
        <text x={PAD.left - 4} y={PAD.top + 4} textAnchor="end" fontSize="8" className="fill-gray-400 dark:fill-gray-500">
          {Math.round(maxElev)}m
        </text>
        <text x={PAD.left - 4} y={PAD.top + innerH} textAnchor="end" fontSize="8" className="fill-gray-400 dark:fill-gray-500">
          {Math.round(minElev)}m
        </text>

        {/* Mid elevation label */}
        <text x={toX(midDist)} y={toY(midElev) - 3} textAnchor="middle" fontSize="7" className="fill-gray-400 dark:fill-gray-500">
          {Math.round(midElev)}m
        </text>

        {/* X-axis labels */}
        <text x={PAD.left} y={H - 4} textAnchor="start" fontSize="8" className="fill-gray-400 dark:fill-gray-500">
          0
        </text>
        <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize="8" className="fill-gray-400 dark:fill-gray-500">
          {distanceLabel}
        </text>
      </svg>

      {/* Summary row */}
      <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
          ↑ {Math.round(totalGainM)} m
          <span className="text-gray-400 dark:text-gray-500 ml-0.5">{t('hiking.elevationGain')}</span>
        </span>
        <span className="flex items-center gap-0.5 text-red-500 dark:text-red-400">
          ↓ {Math.round(totalLossM)} m
          <span className="text-gray-400 dark:text-gray-500 ml-0.5">{t('hiking.elevationLoss')}</span>
        </span>
      </div>
    </div>
  );
}
