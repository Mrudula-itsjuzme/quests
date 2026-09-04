import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Leaflet is loaded lazily to avoid SSR issues with the window object
let L = null;

async function getLeaflet() {
  if (L) return L;
  L = (await import('leaflet')).default;
  // Fix default marker icons broken by bundlers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  return L;
}

// Custom pin HTML for hotspot markers
function makePinHtml(pin) {
  const grade = pin.grade || '';
  const gradeClass = grade ? `rank-hex-${grade.toLowerCase()}` : 'map-pin-curated';
  const label = grade || getCategoryEmoji(pin.category);
  return `
    <div class="map-leaflet-pin ${gradeClass}" title="${pin.title}">
      <div class="map-leaflet-pin-inner">${label}</div>
    </div>
  `;
}

function getCategoryEmoji(category = '') {
  const map = { Parks: '🌳', Waterfalls: '💧', Birding: '🦜', Hotspots: '⭐' };
  return map[category] || '📍';
}

export function WorldCanvas({ hotspots = [], onSelectHotspot, userPosition }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const offlineNative = import.meta.env.VITE_OFFLINE_NATIVE === 'true';

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    let destroyed = false;
    getLeaflet().then((Leaflet) => {
      if (destroyed || !containerRef.current) return;

      // Center on Bangalore by default (user's location used when available)
      const map = Leaflet.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([12.9716, 77.5946], 12);

      if (!offlineNative) {
        // OpenStreetMap standard tiles (No API Key Required)
        Leaflet.tileLayer(
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          },
        ).addTo(map);

        // Compact attribution in bottom-right
        Leaflet.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
      }

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [offlineNative]);

  // Update user position marker
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    getLeaflet().then((Leaflet) => {
      if (!mapRef.current) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      const pos = userPosition || { lat: 12.9716, lng: 77.5946 };

      const userIcon = Leaflet.divIcon({
        className: '',
        html: `<div class="map-user-dot"><div class="map-user-pulse-ring"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = Leaflet.marker([pos.lat, pos.lng], { icon: userIcon })
        .addTo(mapRef.current);

      // Pan to user position
      mapRef.current.setView([pos.lat, pos.lng], 13, { animate: true });
    });
  }, [mapReady, userPosition]);

  // Update hotspot markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    getLeaflet().then((Leaflet) => {
      if (!mapRef.current) return;

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      hotspots.forEach((pin) => {
        const lat = pin.lat ?? pin.gps?.lat;
        const lng = pin.lng ?? pin.gps?.lng;
        if (!lat || !lng) return;

        const icon = Leaflet.divIcon({
          className: '',
          html: makePinHtml(pin),
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        });

        const marker = Leaflet.marker([lat, lng], { icon })
          .addTo(mapRef.current)
          .on('click', () => onSelectHotspot?.(pin));

        markersRef.current.push(marker);
      });
    });
  }, [hotspots, mapReady, onSelectHotspot]);

  return (
    <div className={`world-canvas-wrap${offlineNative ? ' is-offline-map' : ''}`} ref={containerRef} />
  );
}
