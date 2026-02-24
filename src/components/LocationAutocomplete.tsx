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
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onPlaceSelect);
  callbackRef.current = onPlaceSelect;

  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !containerRef.current) return;

    const el = new google.maps.places.PlaceAutocompleteElement({});
    el.setAttribute('placeholder', t('planForm.locationSearchPlaceholder'));

    const handleSelect = async (e: Event) => {
      const customEvent = e as unknown as {
        placePrediction?: {
          toPlace: () => google.maps.places.Place;
        };
      };
      const prediction = customEvent.placePrediction;
      if (!prediction) return;

      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'location', 'addressComponents'],
      });

      const components = place.addressComponents ?? [];
      const get = (type: string) =>
        components.find((c: google.maps.places.AddressComponent) =>
          c.types.includes(type)
        )?.longText ?? undefined;

      callbackRef.current({
        name: place.displayName ?? '',
        city:
          get('locality') ||
          get('sublocality') ||
          get('administrative_area_level_2'),
        country: get('country'),
        region: get('administrative_area_level_1'),
        latitude: place.location?.lat() ?? 0,
        longitude: place.location?.lng() ?? 0,
      });
    };

    el.addEventListener('gmp-select', handleSelect);
    containerRef.current.appendChild(el);

    return () => {
      el.removeEventListener('gmp-select', handleSelect);
      el.remove();
    };
  }, [places, t]);

  return <div ref={containerRef} className="location-autocomplete-container" />;
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
      <APIProvider apiKey={MAPS_API_KEY} version="weekly">
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
