import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { OSMNode, Location } from '../types';
import { Icon } from './Icon';

// --- Custom Icons ---

const createDestinationIcon = (isSelected: boolean) => {
  const color = isSelected ? '#2563eb' : '#ef4444'; // Blue if selected, Red otherwise
  const scale = isSelected ? 'scale(1.2)' : 'scale(1)';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  `;

  return new L.DivIcon({
    className: 'custom-pin-icon',
    html: `<div style="transform: ${scale}; transition: transform 0.2s; width: 36px; height: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${svg}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const UserLocationIcon = new L.DivIcon({
  className: 'user-location-icon',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-sm"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// --- Route Controller ---

const RouteController = ({ 
  userLocation, 
  destination 
}: { 
  userLocation: Location; 
  destination: OSMNode | null; 
}) => {
  const map = useMap();
  const [routePositions, setRoutePositions] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!destination) {
      setRoutePositions([]);
      // Reset view to user location if no destination selected
      map.flyTo([userLocation.lat, userLocation.lng], 14);
      return;
    }

    const fetchRoute = async () => {
      try {
        // OSRM Public Demo API (Project-OSRM)
        // Format: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          // OSRM returns [lon, lat], Leaflet needs [lat, lon]
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
          setRoutePositions(coords);
          
          // Fit map bounds to show both user and destination + path
          const bounds = L.latLngBounds([
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lon],
            ...coords
          ]);
          map.fitBounds(bounds, { padding: [50, 50] });
        } else {
          // Fallback: straight line if OSRM fails
          setRoutePositions([
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lon]
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch route", err);
        // Fallback straight line
        setRoutePositions([
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lon]
        ]);
      }
    };

    fetchRoute();
  }, [userLocation, destination, map]);

  if (routePositions.length === 0) return null;

  return (
    <Polyline 
      positions={routePositions} 
      pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.7, dashArray: '1, 10', dashOffset: '10' }} 
    />
  );
};

// --- Main Map Component ---

interface LeafletMapProps {
  userLocation: Location;
  points: OSMNode[];
  serviceLabel: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  userLocation, 
  points, 
  serviceLabel,
  selectedId,
  onSelect
}) => {
  
  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const selectedPoint = selectedId ? points.find(p => p.id === selectedId) || null : null;

  return (
    <div className="h-full w-full z-0 relative bg-slate-200">
      {/* @ts-ignore */}
      <MapContainer
        center={[userLocation.lat, userLocation.lng] as [number, number]}
        zoom={14}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Handle Routing and Camera Movements */}
        <RouteController userLocation={userLocation} destination={selectedPoint} />

        {/* User Location */}
        {/* @ts-ignore */}
        <Marker position={[userLocation.lat, userLocation.lng] as [number, number]} icon={UserLocationIcon}>
          {/* @ts-ignore */}
          <Popup closeButton={false} className="font-sans">
            <div className="text-center font-bold text-xs py-1 px-2">موقعك الحالي</div>
          </Popup>
        </Marker>

        {/* Service Markers */}
        {points.map((point) => {
          const name = point.tags?.['name:ar'] || point.tags?.['name'] || serviceLabel;
          const isSelected = selectedId === point.id;

          return (
            /* @ts-ignore */
            <Marker
              key={point.id}
              position={[point.lat, point.lon] as [number, number]}
              icon={createDestinationIcon(isSelected)}
              eventHandlers={{
                click: () => onSelect(point.id),
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Popup>
                <div className="min-w-[160px] text-right font-sans" dir="rtl">
                  <h3 className="font-bold text-base text-slate-800 mb-1">{name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{serviceLabel}</p>
                  <button
                    onClick={() => openGoogleMaps(point.lat, point.lon)}
                    className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>فتح في Google Maps</span>
                    <Icon name="Navigation" size={12} />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;