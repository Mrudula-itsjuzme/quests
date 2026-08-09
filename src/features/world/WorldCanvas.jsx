import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { WeatherLayer } from './WeatherLayer';

export const HOTSPOT_LOCATIONS = [
  {
    id: 'jim-corbett',
    title: 'Jim Corbett NP',
    rating: '4.8',
    distance: '12 km',
    category: 'Hotspots',
    thumb: '/assets/african-grey-parrot.png',
    bg: '/assets/verdant-explorer-banner.png',
    x: 42,
    y: 35,
    to: '/app/collection',
  },
  {
    id: 'valley-flowers',
    title: 'Valley of Flowers NP',
    rating: '4.9',
    distance: '34 km',
    category: 'Parks',
    thumb: '/assets/blue-billed-cuckoo.png',
    bg: '/assets/verdant-explorer-banner.png',
    x: 68,
    y: 28,
    to: '/app/collection',
  },
  {
    id: 'silent-valley',
    title: 'Silent Valley NP',
    rating: '4.7',
    distance: '85 km',
    category: 'Parks',
    thumb: '/assets/african-grey-parrot.png',
    bg: '/assets/verdant-explorer-banner.png',
    x: 25,
    y: 65,
    to: '/app/collection',
  },
  {
    id: 'kaziranga',
    title: 'Kaziranga NP',
    rating: '4.8',
    distance: '120 km',
    category: 'Hotspots',
    thumb: '/assets/blue-billed-cuckoo.png',
    bg: '/assets/verdant-explorer-banner.png',
    x: 78,
    y: 70,
    to: '/app/collection',
  },
];

export const NEARBY_HOTSPOTS = [
  {
    id: 'athirappilly',
    title: 'Athirappilly Waterfalls',
    rating: '4.8',
    distance: '2.4 km',
    category: 'Waterfalls',
    bg: '/assets/verdant-explorer-banner.png',
  },
  {
    id: 'thattekkad',
    title: 'Thattekkad Bird Sanctuary',
    rating: '4.7',
    distance: '4.8 km',
    category: 'Birding',
    bg: '/assets/blue-billed-cuckoo.png',
  },
  {
    id: 'parambikulam',
    title: 'Parambikulam Tiger Reserve',
    rating: '4.9',
    distance: '12 km',
    category: 'Hotspots',
    bg: '/assets/african-grey-parrot.png',
  },
];

export function WorldCanvas({ phase, weather, hotspots = HOTSPOT_LOCATIONS, onSelectHotspot }) {
  return (
    <div className={`world-canvas-wrap world-phase-${phase}`}>
      {/* Terrain & Satellite Map Image Background */}
      <div className="explore-map-terrain" />

      {/* Interactive Map Hotspot Pins */}
      {hotspots.map((pin) => (
        <motion.div
          key={pin.id}
          className="map-hotspot-pin"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.15 }}
          onClick={() => onSelectHotspot(pin)}
        >
          <div className="map-hotspot-thumb" style={{ backgroundImage: `url(${pin.thumb})` }} />
          <div className="map-hotspot-label">
            <span>{pin.title}</span>
            <span className="map-hotspot-rating">★ {pin.rating}</span>
          </div>
        </motion.div>
      ))}

      {/* User Location Radar Pulse */}
      <div className="map-user-pin" style={{ left: '50%', top: '50%' }}>
        <div className="map-user-pulse" />
      </div>

      <WeatherLayer condition={weather} phase={phase} />
    </div>
  );
}

