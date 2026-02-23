import { z } from 'zod';
import { forecastSchema, type Forecast } from './schemas/weather';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const OPEN_METEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1';
const GOOGLE_GEOCODING = 'https://maps.googleapis.com/maps/api/geocode/json';

const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
    precipitation_sum: z.array(z.number().nullable()),
    weather_code: z.array(z.number().nullable()),
  }),
});

const openMeteoGeoSchema = z.object({
  results: z
    .array(z.object({ latitude: z.number(), longitude: z.number() }))
    .optional(),
});

const googleGeoSchema = z.object({
  status: z.string(),
  results: z.array(
    z.object({
      geometry: z.object({
        location: z.object({ lat: z.number(), lng: z.number() }),
      }),
    })
  ),
});

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingError';
  }
}

export class ForecastUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForecastUnavailableError';
  }
}

async function geocodeViaOpenMeteo(query: string): Promise<Coordinates | null> {
  try {
    const params = new URLSearchParams({ name: query, count: '1' });
    const response = await fetch(`${OPEN_METEO_GEOCODING}/search?${params}`);
    if (!response.ok) return null;

    const data = openMeteoGeoSchema.parse(await response.json());
    if (!data.results?.length) return null;

    return {
      latitude: data.results[0].latitude,
      longitude: data.results[0].longitude,
    };
  } catch {
    return null;
  }
}

async function geocodeViaGoogle(query: string): Promise<Coordinates | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({ address: query, key: apiKey });
    const response = await fetch(`${GOOGLE_GEOCODING}?${params}`);
    if (!response.ok) return null;

    const data = googleGeoSchema.parse(await response.json());
    if (data.status !== 'OK' || !data.results.length) return null;

    return {
      latitude: data.results[0].geometry.location.lat,
      longitude: data.results[0].geometry.location.lng,
    };
  } catch {
    return null;
  }
}

export async function geocodeLocation(
  cityQuery: string,
  fullQuery: string
): Promise<Coordinates> {
  const result =
    (await geocodeViaOpenMeteo(cityQuery)) ??
    (await geocodeViaGoogle(fullQuery));

  if (!result) {
    throw new GeocodingError('Location not found');
  }

  return result;
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    timezone: 'auto',
    start_date: toDateOnly(startDate),
    end_date: toDateOnly(endDate),
  });

  const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const raw = openMeteoResponseSchema.parse(await response.json());

  const days = raw.daily.time
    .map((date, i) => {
      const max = raw.daily.temperature_2m_max[i];
      const min = raw.daily.temperature_2m_min[i];
      const precip = raw.daily.precipitation_sum[i];
      const code = raw.daily.weather_code[i];

      if (max == null || min == null || code == null) return null;

      return {
        date,
        temperatureMax: max,
        temperatureMin: min,
        precipitationSum: precip ?? 0,
        weatherCode: code,
      };
    })
    .filter((d) => d !== null);

  if (days.length === 0) {
    throw new ForecastUnavailableError(
      'No forecast data available for these dates'
    );
  }

  return forecastSchema.parse({
    latitude: raw.latitude,
    longitude: raw.longitude,
    days,
  });
}
