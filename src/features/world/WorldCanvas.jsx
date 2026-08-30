import { motion } from 'framer-motion';
import { WeatherLayer } from './WeatherLayer';
import { Icon, categoryIcon } from '../../components/Icon';

export function WorldCanvas({ phase, weather, hotspots = [], onSelectHotspot }) {
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
          initial={{ scale: 0, opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
          animate={{ scale: [1, 1.05, 1], opacity: 1, clipPath: 'circle(100% at 50% 50%)' }}
          transition={{ 
            clipPath: { duration: 0.8, ease: 'easeOut' },
            scale: { repeat: Infinity, duration: 4, ease: 'easeInOut', delay: Math.random() * 2 }
          }}
          whileHover={{ scale: 1.15, y: -4 }}
          onClick={() => onSelectHotspot?.(pin)}
        >
          {/* Capture clusters show their best rarity grade; curated places show
              a category icon. Bare initials ("H", "W", "B") read as placeholder
              art on a map, so curated pins use the shared icon family instead. */}
          <div className={pin.grade ? `map-hotspot-thumb rank-hex-${pin.grade.toLowerCase()}` : 'map-hotspot-thumb map-hotspot-curated'}>
            {pin.grade || <Icon name={categoryIcon(pin.category)} />}
          </div>
          <div className="map-hotspot-label">
            <span>{pin.title}</span>
            {pin.distanceLabel && <span className="map-hotspot-rating">{pin.distanceLabel}</span>}
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

