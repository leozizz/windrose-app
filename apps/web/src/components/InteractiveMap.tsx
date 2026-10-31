import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ExternalLink } from 'lucide-react';
import { PointOfInterest, PoiCategory } from '@windrose/shared-types';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
  places: PointOfInterest[];
  center?: { lat: number; lon: number };
  zoom?: number;
  height?: string;
}

// Custom Category SVG Marker Icons
function createCustomPin(category: PoiCategory): L.DivIcon {
  let color = '#f97316'; // Terracotta default
  let svgPath = '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>';

  switch (category) {
    case PoiCategory.BEACH:
      color = '#0284c7';
      svgPath = '<path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-5-2.5 0-5 2.24-5 5Z"/><path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-5-2.5 0-5 2.24-5 5Z"/><path d="m7 12 5-10 5 10"/>';
      break;
    case PoiCategory.PARK:
      color = '#16a34a';
      svgPath = '<path d="m12 19 3-6h-2l3-6h-3l2-4h-6l2 4H8l3 6H9l3 6Z"/><path d="M12 19v3"/>';
      break;
    case PoiCategory.MUSEUM:
      color = '#7c3aed';
      svgPath = '<line x1="3" y1="21" x2="21" y2="21"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>';
      break;
    case PoiCategory.RESTAURANT:
      color = '#ea580c';
      svgPath = '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v20"/><path d="M2 4h6"/>';
      break;
    case PoiCategory.BAR:
      color = '#e11d48';
      svgPath = '<path d="m8 22 8 0"/><path d="M12 15v7"/><path d="m19 3-7 8-7-8Z"/>';
      break;
    default:
      color = '#f97316';
      svgPath = '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>';
      break;
  }

  const html = `
    <div style="
      background-color: ${color};
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      border: 2px solid #ffffff;
      cursor: pointer;
    ">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="transform: rotate(45deg); display: block;"
      >
        ${svgPath}
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

// Auto-adjust map bounds to frame all points
function FitBoundsToMarkers({ places }: { places: PointOfInterest[] }) {
  const map = useMap();

  useEffect(() => {
    if (!places || places.length === 0) return;

    const validPlaces = places.filter(
      (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
    );

    if (validPlaces.length === 0) return;

    if (validPlaces.length === 1) {
      map.setView([validPlaces[0].latitude, validPlaces[0].longitude], 14, {
        animate: true,
      });
      return;
    }

    const bounds = L.latLngBounds(
      validPlaces.map((p) => [p.latitude, p.longitude] as [number, number])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15,
      animate: true,
    });
  }, [places, map]);

  return null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  places,
  center,
  zoom = 13,
  height = '420px',
}) => {
  const validPlaces = places.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
  );

  const defaultCenter: [number, number] = center
    ? [center.lat, center.lon]
    : validPlaces.length > 0
    ? [validPlaces[0].latitude, validPlaces[0].longitude]
    : [-27.5954, -48.548];

  return (
    <div
      className="interactive-map-wrapper"
      style={{
        height, width: '100%', position: 'relative', zIndex: 1, isolation: 'isolate',
        borderRadius: 'var(--radius-xl, 24px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-light)',
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <FitBoundsToMarkers places={validPlaces} />

        {validPlaces.map((place) => {
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            place.name + ' ' + (place.address || place.city)
          )}`;

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomPin(place.category)}
            >
              <Popup className="windrose-map-popup">
                <div style={{ maxWidth: '240px', padding: '0.25rem' }}>
                  {place.imageUrl && (
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      style={{
                        width: '100%',
                        height: '110px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                      }}
                      loading="lazy"
                    />
                  )}
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
                    {place.name}
                  </h4>
                  {place.address && (
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} style={{ flexShrink: 0, color: 'var(--primary, #f97316)' }} />
                      <span>{place.address}</span>
                    </p>
                  )}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'var(--primary, #f97316)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                    }}
                  >
                    <span>Rotas no Google Maps</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

