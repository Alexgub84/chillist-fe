import { Component, type ReactNode } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from '@vis.gl/react-google-maps';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface LocationMapProps {
  latitude: number;
  longitude: number;
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

export default function LocationMap({ latitude, longitude }: LocationMapProps) {
  if (!MAPS_API_KEY) return null;

  const center = { lat: latitude, lng: longitude };

  return (
    <MapErrorBoundary>
      <APIProvider apiKey={MAPS_API_KEY}>
        <div className="rounded-lg overflow-hidden border border-gray-200 h-[200px] sm:h-[250px] w-full sm:w-[300px] shrink-0">
          <Map
            defaultCenter={center}
            defaultZoom={13}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            mapId="DEMO_MAP_ID"
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={center}>
              <Pin />
            </AdvancedMarker>
          </Map>
        </div>
      </APIProvider>
    </MapErrorBoundary>
  );
}
