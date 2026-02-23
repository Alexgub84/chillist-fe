import { useTranslation } from 'react-i18next';
import { useForecast } from '../hooks/useForecast';
import { GeocodingError, ForecastUnavailableError } from '../core/weather-api';
import type { Location } from '../core/schemas/location';
import type { ForecastDay } from '../core/schemas/weather';

const WMO_ICON: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌦️',
  56: '🌧️',
  57: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  66: '🌧️',
  67: '🌧️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  77: '❄️',
  80: '🌧️',
  81: '🌧️',
  82: '🌧️',
  85: '🌨️',
  86: '🌨️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

function weatherIcon(code: number): string {
  return WMO_ICON[code] ?? '🌡️';
}

function weatherKey(code: number): string {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partlyCloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'showers';
  return 'thunderstorm';
}

function formatDay(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
}

function ForecastDays({ days }: { days: ForecastDay[] }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'he' ? 'he-IL' : 'en-US';

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {days.map((day) => (
        <div
          key={day.date}
          className="flex flex-col items-center gap-1 min-w-18 rounded-lg bg-gray-50 px-3 py-2.5 shrink-0"
        >
          <span className="text-xs font-medium text-gray-500">
            {formatDay(day.date, locale)}
          </span>
          <span
            className="text-2xl leading-none"
            role="img"
            aria-label={t(`weather.${weatherKey(day.weatherCode)}`)}
          >
            {weatherIcon(day.weatherCode)}
          </span>
          <span className="text-xs text-gray-400">
            {t(`weather.${weatherKey(day.weatherCode)}`)}
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {Math.round(day.temperatureMax)}°
          </span>
          <span className="text-xs text-gray-400">
            {Math.round(day.temperatureMin)}°
          </span>
          {day.precipitationSum > 0 && (
            <span className="text-[10px] text-blue-500 font-medium">
              {day.precipitationSum.toFixed(1)} mm
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

interface ForecastProps {
  location: Location | null | undefined;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
}

function ForecastShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-3">
        {t('forecast.title')}
      </p>
      {children}
    </div>
  );
}

function ForecastMessage({
  message,
  variant = 'info',
}: {
  message: string;
  variant?: 'info' | 'error';
}) {
  return (
    <ForecastShell>
      <p
        className={
          variant === 'error' ? 'text-sm text-red-500' : 'text-sm text-gray-400'
        }
      >
        {message}
      </p>
    </ForecastShell>
  );
}

export default function Forecast({
  location,
  startDate,
  endDate,
}: ForecastProps) {
  const { t } = useTranslation();
  const { data, error, isLoading } = useForecast(location, startDate, endDate);

  if (error) {
    console.warn('[Forecast]', error.message);
  }

  if (!location && (!startDate || !endDate)) {
    return <ForecastMessage message={t('forecast.missingLocationAndDates')} />;
  }

  if (!location) {
    return <ForecastMessage message={t('forecast.missingLocation')} />;
  }

  if (!startDate || !endDate) {
    return <ForecastMessage message={t('forecast.missingDates')} />;
  }

  const isPast = new Date(endDate) < new Date();
  if (isPast) {
    return <ForecastMessage message={t('forecast.pastDates')} />;
  }

  if (isLoading) {
    return <ForecastMessage message={t('forecast.loading')} />;
  }

  if (error) {
    let msg = t('forecast.error');
    if (error instanceof GeocodingError) {
      msg = t('forecast.locationNotFound');
    } else if (error instanceof ForecastUnavailableError) {
      msg = t('forecast.datesUnavailable');
    }
    return <ForecastMessage message={msg} variant="error" />;
  }

  if (!data) return null;

  return (
    <ForecastShell>
      <ForecastDays days={data.days} />
    </ForecastShell>
  );
}
