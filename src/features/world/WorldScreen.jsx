import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useActiveQuests, useCollectibles, useMe } from '../quests/queries';
import { deriveGold, deriveGems, getEnergy } from '../../lib/playerEconomy';
import { derivePlayerPresentation } from '../../lib/playerPresentation';
import { timeOfDayPhase } from '../../lib/worldTime';
import { WorldCanvas, HOTSPOT_LOCATIONS, NEARBY_HOTSPOTS } from './WorldCanvas';
import { WorldHud } from './WorldHud';
import { CaptureFlow } from './CaptureFlow';
import { pickWeather } from './WeatherLayer';
import { playTap } from '../../lib/useSoundEffects';
import { Icon } from '../../components/Icon';

const CATEGORIES = ['All', 'Hotspots', 'Parks', 'Waterfalls', 'Birding'];

export function WorldScreen() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: quests } = useActiveQuests();
  const { data: collectibles } = useCollectibles();
  const navigate = useNavigate();

  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHotspot, setActiveHotspot] = useState(null);

  const phase = useMemo(() => timeOfDayPhase(new Date().getHours()), []);
  const weather = useMemo(() => pickWeather(), []);

  const activeQuests = useMemo(() => quests || [], [quests]);
  const presentation = useMemo(
    () => derivePlayerPresentation(me, activeQuests, [], collectibles || []),
    [me, activeQuests, collectibles],
  );
  const gold = deriveGold(me?.totalXp);
  const gems = deriveGems(collectibles);
  const energy = getEnergy();

  useEffect(() => {
    const handleOpenCaptureEvent = () => {
      setCaptureOpen(true);
    };
    window.addEventListener('wild-realm-open-capture', handleOpenCaptureEvent);
    return () => window.removeEventListener('wild-realm-open-capture', handleOpenCaptureEvent);
  }, []);

  const filteredHotspots = useMemo(() => {
    return HOTSPOT_LOCATIONS.filter((item) => {
      const matchesCategory = selectedTag === 'All' || item.category === selectedTag;
      const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedTag, searchQuery]);

  if (meLoading || !me) {
    return <div className="world-screen world-screen-loading" aria-busy="true" />;
  }

  return (
    <motion.div
      className="world-explore-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Search & Filter Bar Overlay */}
      <div className="explore-search-bar">
        <div className="explore-search-input-wrap">
          <Icon name="compass" />
          <input
            type="text"
            className="explore-search-input"
            placeholder="Search places, parks, waterfalls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className="explore-filter-btn" aria-label="Filter Map">
            <Icon name="gear" />
          </button>
        </div>

        <div className="explore-category-tags">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`explore-tag ${selectedTag === cat ? 'active' : ''}`}
              onClick={() => {
                playTap();
                setSelectedTag(cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Satellite Terrain Map & Pin Canvas */}
      <WorldCanvas
        phase={phase}
        weather={weather}
        hotspots={filteredHotspots}
        onSelectHotspot={(hotspot) => {
          playTap();
          setActiveHotspot(hotspot);
          navigate(hotspot.to);
        }}
      />

      {/* Map Control Buttons */}
      <button type="button" className="map-control-btn map-control-layers" aria-label="Toggle Layers" onClick={playTap}>
        <Icon name="grid" />
      </button>
      <button type="button" className="map-control-btn map-control-locate" aria-label="Locate Me" onClick={playTap}>
        <Icon name="compass" />
      </button>

      {/* Bottom Sheet: Top Nature Hotspots Near You */}
      <div className="explore-bottom-sheet">
        <div className="explore-sheet-header">
          <h3>Top Nature Hotspots Near You</h3>
          <button type="button" className="explore-sheet-see-all" onClick={() => navigate('/app/collection')}>
            See all ›
          </button>
        </div>

        <div className="explore-hotspot-cards">
          {NEARBY_HOTSPOTS.length > 0 ? (
            NEARBY_HOTSPOTS.map((place) => (
              <motion.div
                key={place.id}
                className="explore-hotspot-card"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  playTap();
                  navigate('/app/collection');
                }}
              >
                <div className="explore-hotspot-bg" style={{ backgroundImage: `url(${place.bg})` }} />
                <div className="explore-hotspot-overlay">
                  <h4 className="explore-hotspot-title">{place.title}</h4>
                  <div className="explore-hotspot-meta">
                    <span>{place.distance}</span>
                    <span className="explore-hotspot-rating">★ {place.rating}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', width: '100%', color: 'var(--wild-text-dim)', fontSize: '0.9rem' }}>
              Scanning area for new hotspots...
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {captureOpen && <CaptureFlow onClose={() => setCaptureOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

