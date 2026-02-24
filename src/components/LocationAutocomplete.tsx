import {
  useEffect,
  useRef,
  useState,
  useCallback,
  Component,
  type ReactNode,
} from 'react';
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
  inputRef: React.RefObject<HTMLInputElement | null>;
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

interface Suggestion {
  placeId: string;
  text: string;
  toPlace: () => google.maps.places.Place;
}

function AutocompleteSuggestions({
  onPlaceSelect,
  inputRef,
}: {
  onPlaceSelect: (place: PlaceResult) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const callbackRef = useRef(onPlaceSelect);
  callbackRef.current = onPlaceSelect;
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const places = useMapsLibrary('places');

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!places || input.length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      if (!sessionTokenRef.current) {
        sessionTokenRef.current =
          new google.maps.places.AutocompleteSessionToken();
      }

      try {
        const { suggestions: results } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input,
              sessionToken: sessionTokenRef.current,
            }
          );

        const mapped: Suggestion[] = results
          .filter((s) => s.placePrediction)
          .map((s) => ({
            placeId: s.placePrediction!.placeId,
            text: s.placePrediction!.text.toString(),
            toPlace: () => s.placePrediction!.toPlace(),
          }));

        setSuggestions(mapped);
        setOpen(mapped.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    },
    [places]
  );

  const handleSelect = useCallback(async (suggestion: Suggestion) => {
    setOpen(false);
    setSuggestions([]);

    const place = suggestion.toPlace();
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

    sessionTokenRef.current = null;
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onInput = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(input.value);
      }, 300);
    };

    const onFocusOut = (e: FocusEvent) => {
      const related = e.relatedTarget as Node | null;
      if (containerRef.current?.contains(related)) return;
      setTimeout(() => setOpen(false), 150);
    };

    input.addEventListener('input', onInput);
    input.addEventListener('focusout', onFocusOut);

    return () => {
      input.removeEventListener('input', onInput);
      input.removeEventListener('focusout', onFocusOut);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputRef, fetchSuggestions]);

  if (!open || suggestions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
    >
      <ul className="max-h-60 overflow-auto py-1">
        {suggestions.map((s) => (
          <li key={s.placeId}>
            <button
              type="button"
              className="w-full px-3 py-2 text-start text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
            >
              {s.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
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
  inputRef,
}: LocationAutocompleteProps) {
  if (!MAPS_API_KEY) return null;

  return (
    <MapErrorBoundary>
      <APIProvider apiKey={MAPS_API_KEY}>
        <AutocompleteSuggestions
          onPlaceSelect={onPlaceSelect}
          inputRef={inputRef}
        />
        {latitude != null && longitude != null && (
          <MapPreview latitude={latitude} longitude={longitude} />
        )}
      </APIProvider>
    </MapErrorBoundary>
  );
}
