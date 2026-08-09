import { motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { WeatherLayer } from './WeatherLayer';

export const HOTSPOT_LOCATIONS = [];
export const NEARBY_HOTSPOTS = [];

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

