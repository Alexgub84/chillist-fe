import { useEffect, useRef, Component, type ReactNode } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onPlaceSelect);
  callbackRef.current = onPlaceSelect;
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(
    null
  );

  const places = useMapsLibrary('places');

  useEffect(() => {
    const container = containerRef.current;
    if (!places || !container || elementRef.current) return;

    try {
      const autocomplete = new google.maps.places.PlaceAutocompleteElement({});
      elementRef.current = autocomplete;
      container.appendChild(autocomplete);

      const processPlace = async (place: google.maps.places.Place) => {
        await place.fetchFields({
          fields: ['displayName', 'location', 'addressComponents'],
        });

        const components = place.addressComponents || [];
        const get = (type: string) =>
          components.find((c) => c.types.includes(type))?.longText ?? undefined;

        callbackRef.current({
          name: place.displayName || '',
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

      const handlePlaceSelect = (event: Event) => {
        const e = event as unknown as {
          place?: google.maps.places.Place;
        };
        if (e.place) void processPlace(e.place);
      };

      const handleGmpSelect = (event: Event) => {
        const e = event as unknown as {
          placePrediction?: { toPlace(): google.maps.places.Place };
        };
        if (e.placePrediction) void processPlace(e.placePrediction.toPlace());
      };

      autocomplete.addEventListener('gmp-placeselect', handlePlaceSelect);
      autocomplete.addEventListener('gmp-select', handleGmpSelect);

      return () => {
        autocomplete.removeEventListener('gmp-placeselect', handlePlaceSelect);
        autocomplete.removeEventListener('gmp-select', handleGmpSelect);
        if (container.contains(autocomplete)) {
          container.removeChild(autocomplete);
        }
        elementRef.current = null;
      };
    } catch {
      // PlaceAutocompleteElement not available — container stays empty, manual fields still work
    }
  }, [places]);

  return (
    <div
      ref={containerRef}
      className="w-full [&>gmp-place-autocomplete]:w-full"
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
      <APIProvider apiKey={MAPS_API_KEY} version="beta">
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
