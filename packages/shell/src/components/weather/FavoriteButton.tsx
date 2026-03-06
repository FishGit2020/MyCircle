import React from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';

export default function FavoriteButton() {
  const { t } = useTranslation();
  const { coords } = useParams<{ coords: string }>();
  const [searchParams] = useSearchParams();
  const { user, favoriteCities, toggleFavorite } = useAuth();

  if (!user || !coords) return null;

  const [lat, lon] = coords.split(',').map(Number);
  if (isNaN(lat) || isNaN(lon)) return null;

  const cityName = searchParams.get('name') || 'Unknown';
  const cityId = `${lat},${lon}`;
  const isFavorite = favoriteCities.some(c => c.id === cityId);

  const handleToggle = async () => {
    await toggleFavorite({
      id: cityId,
      name: cityName,
      country: '',
      lat,
      lon,
    });
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        isFavorite
          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
      }`}
      title={isFavorite ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span className="hidden sm:inline">{isFavorite ? t('favorites.favorited') : t('favorites.favorite')}</span>
    </button>
  );
}
