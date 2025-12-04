// src/components/MapView.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';

export default function MapView({ services }) {
  const points = services.filter(
    (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
  );

  const fallbackCenter = [-2.5, 118]; // tengah2 Indonesia
  const center = points.length
    ? [points[0].lat, points[0].lng]
    : fallbackCenter;

  return (
    <div className="mt-2 h-[480px] rounded-xl overflow-hidden border border-slate-200 bg-slate-200">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold text-slate-900">
                  {s.name}
                </div>
                <div className="text-slate-700">
                  {(s.address || '').length > 40
                    ? (s.address || '').slice(0, 40) + '...'
                    : s.address || '-'}
                </div>
                <div className="mt-1 text-[10px] text-rose-700">
                  {(s.service_types || []).slice(0, 2).join(', ')}
                </div>
                <div className="mt-1 text-[10px] text-emerald-700">
                  {s.phone || '-'}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
