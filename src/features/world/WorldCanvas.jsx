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
  if (pin.obfuscated || pin.gps?.obfuscated) {
    return `
      <div class="map-leaflet-pin map-pin-obfuscated" title="Approximate Location: ${pin.title}">
        <div class="map-leaflet-pin-inner" style="border-style: dashed; border-color: rgba(255,100,100,0.8); color: #ff6666;">?</div>
      </div>
    `;
  }
  const grade = pin.grade || '';
  const gradeClass = grade ? `rank-hex-${grade.toLowerCase()}` : 'map-pin-curated';
  const label = grade || getCategoryEmoji(pin.category);
  const imageRef = safeImageRef(pin.imageRef, pin.category);
  return `
    <div class="map-leaflet-pin ${gradeClass}${imageRef ? ' map-pin-photo' : ''}" title="${escapeHtml(pin.title)}">
      <div class="map-leaflet-pin-inner">
        ${imageRef ? `<img src="${imageRef}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : label}
      </div>
    </div>
  `;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
}

function safeImageRef(value, category) {
  if (typeof value !== 'string') return '';
  // Private capture endpoints need authorization headers, which a Leaflet
  // HTML marker cannot attach. Use a local visual fallback instead of a
  // broken image while the authenticated photo remains in the detail card.
  if (value.startsWith('/api/')) return markerFallback(category);
  if (value.startsWith('/') || value.startsWith('data:image/') || /^https:\/\//i.test(value)) return escapeHtml(value);
  return '';
}

function markerFallback(category = '') {
  const key = String(category).toLowerCase();
  if (key.includes('bird')) return '/assets/blue-billed-cuckoo.png';
  if (key.includes('water') || key.includes('park') || key.includes('community')) return '/assets/verdant-explorer-banner.png';
  return '/assets/quest-compass-poster.png';
}

function getCategoryEmoji(category = '') {
  const map = { Parks: '🌳', Waterfalls: '💧', Birding: '🦜', Hotspots: '⭐' };
  return map[category] || '📍';
}

export function WorldCanvas({ hotspots = [], onSelectHotspot, onPointMap, userPosition }) {
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
        const tiles = Leaflet.tileLayer(
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            keepBuffer: 4,
            updateWhenIdle: false,
          },
        );
        tiles.on('tileerror', ({ tile }) => {
          if (!tile || tile.dataset.fallbackApplied === 'true') return;
          tile.dataset.fallbackApplied = 'true';
          tile.src = tile.src.replace('tile.openstreetmap.org', 'tile.openstreetmap.fr/hot');
        });
        tiles.addTo(map);

        // Compact attribution in bottom-right
        Leaflet.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
      }

      mapRef.current = map;
      map.on('click', (event) => onPointMap?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
      setMapReady(true);
      window.requestAnimationFrame(() => {
        if (!destroyed) map.invalidateSize();
      });
      window.setTimeout(() => {
        if (!destroyed) map.invalidateSize();
      }, 250);
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [offlineNative, onPointMap]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return undefined;
    const resize = () => mapRef.current?.invalidateSize();
    const observer = typeof ResizeObserver === 'function' && containerRef.current
      ? new ResizeObserver(resize)
      : null;
    observer?.observe(containerRef.current);
    window.addEventListener('resize', resize);
    const timer = window.setTimeout(resize, 350);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      window.clearTimeout(timer);
    };
  }, [mapReady]);

  // Update user position marker
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    getLeaflet().then((Leaflet) => {
      if (!mapRef.current) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      // Do not draw a fabricated "you are here" marker while a real location
      // fix is unresolved. The old Bengaluru fallback looked like live GPS.
      if (!userPosition) return;
      const pos = userPosition;

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
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

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
