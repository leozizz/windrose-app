import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  let iconEmoji = '📍';

  switch (category) {
    case PoiCategory.BEACH:
      color = '#0284c7';
      iconEmoji = '🏖️';
      break;
    case PoiCategory.PARK:
      color = '#16a34a';
      iconEmoji = '🌳';
      break;
    case PoiCategory.MUSEUM:
      color = '#7c3aed';
      iconEmoji = '🏛️';
      break;
    case PoiCategory.RESTAURANT:
      color = '#ea580c';
      iconEmoji = '🍽️';
      break;
    case PoiCategory.BAR:
      color = '#e11d48';
      iconEmoji = '🍸';
      break;
    default:
      color = '#f97316';
      iconEmoji = '✨';
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
      <span style="
        transform: rotate(45deg);
        font-size: 14px;
        line-height: 1;
      ">${iconEmoji}</span>
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
      map.setView([validPlaces[0].latitude, validPlaces[0].longitude], 14);
      return;
    }

    const bounds = L.latLngBounds(
      validPlaces.map((p) => [p.latitude, p.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [places, map]);

  return null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  places,
  center,
  zoom = 13,
  height = '460px',
}) => {
  const defaultCenter: [number, number] =
    places.length > 0 && places[0].latitude && places[0].longitude
      ? [places[0].latitude, places[0].longitude]
      : center
      ? [center.lat, center.lon]
      : [0, 0];

  return (
    <div
      className="interactive-map-wrapper"
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--radius-xl, 24px)',
        overflow: 'hidden',
        border: '1px solid var(--border-light, rgba(226, 232, 240, 0.8))',
        boxShadow: 'var(--shadow-card, 0 10px 30px rgba(0,0,0,0.06))',
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={places.length > 0 ? zoom : 2}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* OpenStreetMap Standard Tiles (100% Free, Open and requires NO API Key) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBoundsToMarkers places={places} />

        {places.map((place) => {
          if (!place.latitude || !place.longitude) return null;

          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            place.name + ' ' + (place.city || '')
          )}`;

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createCustomPin(place.category)}
            >
              <Popup className="wanderlust-map-popup">
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
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                      📍 {place.address}
                    </p>
                  )}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      background: 'var(--primary, #f97316)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                    }}
                  >
                    Rotas no Google Maps ↗
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
