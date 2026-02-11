import React from 'react';
import { useTranslation } from '@weather/shared';
import { StockCandle } from '../hooks/useStockData';

interface Props {
  symbol: string;
  candles: StockCandle;
}

export default function StockChart({ symbol, candles }: Props) {
  const { t, locale } = useTranslation();

  if (!candles || candles.s === 'no_data' || !candles.c || candles.c.length < 2) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">{t('stocks.noResults')}</p>
      </div>
    );
  }

  const prices = candles.c;
  const timestamps = candles.t;

  const chartWidth = 720;
  const chartHeight = 280;
  const padding = { top: 30, bottom: 40, left: 60, right: 20 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const pricePadding = priceRange * 0.1;
  const adjustedMin = minPrice - pricePadding;
  const adjustedMax = maxPrice + pricePadding;
  const adjustedRange = adjustedMax - adjustedMin;

  const getX = (i: number) => padding.left + (i / (prices.length - 1)) * plotWidth;
  const getY = (price: number) => padding.top + (1 - (price - adjustedMin) / adjustedRange) * plotHeight;

  // Build line path
  const linePath = prices
    .map((price, i) => `${i === 0 ? 'M' : 'L'}${getX(i).toFixed(1)},${getY(price).toFixed(1)}`)
    .join(' ');

  // Build area path (filled underneath the line)
  const areaPath = `${linePath} L${getX(prices.length - 1).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} L${getX(0).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} Z`;

  const isPositive = prices[prices.length - 1] >= prices[0];
  const lineColor = isPositive ? '#22c55e' : '#ef4444';
  const areaColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  // Y-axis price labels (5 ticks)
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const price = adjustedMin + (adjustedRange / (yTicks - 1)) * i;
    return { price, y: getY(price) };
  });

  // X-axis date labels
  const xLabelCount = Math.min(6, prices.length);
  const xStep = Math.max(1, Math.floor((prices.length - 1) / (xLabelCount - 1)));
  const xLabels: { label: string; x: number }[] = [];
  for (let i = 0; i < prices.length; i += xStep) {
    const date = new Date(timestamps[i] * 1000);
    const label = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    xLabels.push({ label, x: getX(i) });
  }
  // Always include the last point
  if (xLabels.length > 0 && xLabels[xLabels.length - 1].x !== getX(prices.length - 1)) {
    const lastDate = new Date(timestamps[prices.length - 1] * 1000);
    xLabels.push({
      label: lastDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      x: getX(prices.length - 1),
    });
  }

  // Find min/max indices
  const minIndex = prices.indexOf(minPrice);
  const maxIndex = prices.indexOf(maxPrice);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{symbol}</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: lineColor }} />
            {t('stocks.price')}
          </span>
          <span>
            {t('stocks.high')}: ${maxPrice.toFixed(2)}
          </span>
          <span>
            {t('stocks.low')}: ${minPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full min-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${symbol} price chart`}
        >
          {/* Grid lines */}
          {yLabels.map(({ y }, i) => (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={areaColor} />

          {/* Price line */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Min/Max markers */}
          <circle cx={getX(maxIndex)} cy={getY(maxPrice)} r={4} fill={lineColor} />
          <text
            x={getX(maxIndex)}
            y={getY(maxPrice) - 10}
            textAnchor="middle"
            className="fill-gray-700 dark:fill-gray-300"
            fontSize={10}
            fontWeight="bold"
          >
            ${maxPrice.toFixed(2)}
          </text>

          <circle cx={getX(minIndex)} cy={getY(minPrice)} r={4} fill={lineColor} />
          <text
            x={getX(minIndex)}
            y={getY(minPrice) + 16}
            textAnchor="middle"
            className="fill-gray-700 dark:fill-gray-300"
            fontSize={10}
            fontWeight="bold"
          >
            ${minPrice.toFixed(2)}
          </text>

          {/* Y-axis labels */}
          {yLabels.map(({ price, y }, i) => (
            <text
              key={`ylabel-${i}`}
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
              className="fill-gray-400 dark:fill-gray-500"
              fontSize={10}
            >
              ${price.toFixed(0)}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabels.map(({ label, x }, i) => (
            <text
              key={`xlabel-${i}`}
              x={x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="fill-gray-400 dark:fill-gray-500"
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            className="stroke-gray-300 dark:stroke-gray-600"
            strokeWidth={1}
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={chartWidth - padding.right}
            y2={padding.top + plotHeight}
            className="stroke-gray-300 dark:stroke-gray-600"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  );
}
