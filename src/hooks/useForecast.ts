import { useQuery } from '@tanstack/react-query';
import { fetchForecast, geocodeLocation } from '../core/weather-api';
import type { Forecast } from '../core/schemas/weather';
import type { Location } from '../core/schemas/location';

function buildCityQuery(location: Location): string {
  if (location.city) {
    return [location.city, location.country].filter(Boolean).join(', ');
  }
  return [location.name, location.country].filter(Boolean).join(', ');
}

function buildFullQuery(location: Location): string {
  return [location.name, location.city, location.region, location.country]
    .filter(Boolean)
    .join(', ');
}

export function useForecast(
  location: Location | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined
) {
  const hasCoords = location?.latitude != null && location?.longitude != null;
  const cityQuery = location && !hasCoords ? buildCityQuery(location) : '';
  const fullQuery = location && !hasCoords ? buildFullQuery(location) : '';
  const hasDates = !!startDate && !!endDate;
  const isPast = hasDates && new Date(endDate!) < new Date();

  return useQuery<Forecast>({
    queryKey: [
      'forecast',
      location?.latitude,
      location?.longitude,
      cityQuery,
      fullQuery,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      let lat = location!.latitude;
      let lon = location!.longitude;

      if (lat == null || lon == null) {
        const coords = await geocodeLocation(cityQuery, fullQuery);
        lat = coords.latitude;
        lon = coords.longitude;
      }

      return fetchForecast(lat, lon, startDate!, endDate!);
    },
    enabled:
      !!location && hasDates && !isPast && (hasCoords || cityQuery.length > 0),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
