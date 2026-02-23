import { z } from 'zod';

export const forecastDaySchema = z.object({
  date: z.string(),
  temperatureMax: z.number(),
  temperatureMin: z.number(),
  precipitationSum: z.number(),
  weatherCode: z.number(),
});

export const forecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  days: z.array(forecastDaySchema),
});

export type ForecastDay = z.infer<typeof forecastDaySchema>;
export type Forecast = z.infer<typeof forecastSchema>;
