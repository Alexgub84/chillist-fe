import { useEffect, useRef, Component, type ReactNode } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useTranslation } from 'react-i18next';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export interface PlaceResult {
  name: string;
  city?: string;
  country?: string;
  region?: string;
  latitude: number;
  longitude: number;
}

interface LocationAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void;
  latitude?: number | null;
  longitude?: number | null;
}

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function AutocompleteInput({
  onPlaceSelect,
}: {
  onPlaceSelect: (place: PlaceResult) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const callbackRef = useRef(onPlaceSelect);
  callbackRef.current = onPlaceSelect;
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    try {
      const autocomplete = new places.Autocomplete(inputRef.current, {
        fields: ['name', 'geometry', 'address_components'],
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const components = place.address_components || [];
        const get = (type: string) =>
          components.find((c) => c.types.includes(type))?.long_name;

        callbackRef.current({
          name: place.name || '',
          city:
            get('locality') ||
            get('sublocality') ||
            get('administrative_area_level_2'),
          country: get('country'),
          region: get('administrative_area_level_1'),
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
      });
    } catch {
      // Google Maps API failed to initialize — input remains a plain text field
    }

    return () => {
      try {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      } catch {
        // google namespace unavailable — nothing to clean up
      }
      autocompleteRef.current = null;
    };
  }, [places]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={t('planForm.locationSearchPlaceholder')}
      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    />
  );
}

function MapPreview({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const center = { lat: latitude, lng: longitude };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 h-[180px] sm:h-[200px]">
      <Map
        defaultCenter={center}
        defaultZoom={14}
        gestureHandling="cooperative"
        disableDefaultUI
        mapId="DEMO_MAP_ID"
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker position={center}>
          <Pin />
        </AdvancedMarker>
      </Map>
    </div>
  );
}

export default function LocationAutocomplete({
  onPlaceSelect,
  latitude,
  longitude,
}: LocationAutocompleteProps) {
  if (!MAPS_API_KEY) return null;

  return (
    <MapErrorBoundary>
      <APIProvider apiKey={MAPS_API_KEY}>
        <div className="space-y-3">
          <AutocompleteInput onPlaceSelect={onPlaceSelect} />
          {latitude != null && longitude != null && (
            <MapPreview latitude={latitude} longitude={longitude} />
          )}
        </div>
      </APIProvider>
    </MapErrorBoundary>
  );
}
