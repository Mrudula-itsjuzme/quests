import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useActiveQuests, useCaptures, useCollectibles, useMarkNotificationRead, useMe, useNotifications, useSpecies, useWorldHotspots } from '../quests/queries';
import { coinBalance, deriveGems, getEnergy } from '../../lib/playerEconomy';
import { derivePlayerPresentation } from '../../lib/playerPresentation';
import { timeOfDayPhase } from '../../lib/worldTime';
import { buildDiscoveryHotspots, mapCuratedHotspots, mergeHotspots } from '../../lib/discoveryHotspots';
import { WorldCanvas } from './WorldCanvas';
import { WorldHud } from './WorldHud';
import { pickWeather } from './WeatherLayer';
import { playTap } from '../../lib/useSoundEffects';
import { Icon } from '../../components/Icon';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const CATEGORIES = ['All', 'Hotspots', 'Parks', 'Waterfalls', 'Birding'];

export function WorldScreen() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: quests } = useActiveQuests();
  const { data: collectibles } = useCollectibles();
  const { data: notifications } = useNotifications();
  const { data: captures } = useCaptures();
  const { data: species } = useSpecies();
  const {
    data: worldHotspots,
    isLoading: hotspotsLoading,
    isError: hotspotsError,
    refetch: refetchHotspots,
  } = useWorldHotspots();
  const markNotificationRead = useMarkNotificationRead();
  const navigate = useNavigate();
  const [lastKnownPosition, setLastKnownPosition] = useState(null);

  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const handleSelectHotspot = useCallback((hotspot) => {
    playTap();
    setSelectedHotspot(hotspot);
  }, []);

  const phase = useMemo(() => timeOfDayPhase(new Date().getHours()), []);
  const weather = useMemo(() => pickWeather(), []);

  const activeQuests = useMemo(() => quests || [], [quests]);
  const presentation = useMemo(
    () => derivePlayerPresentation(me, activeQuests, [], collectibles || []),
    [me, activeQuests, collectibles],
  );
  const gold = coinBalance(me);
  const gems = deriveGems(collectibles);
  const energy = getEnergy();
  const unreadNotifications = useMemo(() => (notifications || []).filter((n) => !n.readAt), [notifications]);

  // Distances are only shown when the browser actually grants a position;
  // a denied or unavailable fix simply omits them.
  useEffect(() => {
    let cancelled = false;
    const fetchLocation = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permission = await Geolocation.checkPermissions();
          if (permission.location !== 'granted') {
            const request = await Geolocation.requestPermissions();
            if (request.location !== 'granted') return;
          }
          const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
          if (!cancelled) setLastKnownPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
        } else {
          if (typeof navigator === 'undefined' || !navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!cancelled) setLastKnownPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
            () => {},
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
          );
        }
      } catch {
        // location error, degrade gracefully
      }
    };
    fetchLocation();
    return () => { cancelled = true; };
  }, []);

  // Explore shows two real layers: curated world hotspots served by
  // /api/v1/world/hotspots, and clusters of the player's own captures.
  const curated = useMemo(
    () => mapCuratedHotspots(worldHotspots, lastKnownPosition),
    [worldHotspots, lastKnownPosition],
  );
  const discovered = useMemo(
    () => buildDiscoveryHotspots(captures, species, lastKnownPosition),
    [captures, species, lastKnownPosition],
  );
  const hotspots = useMemo(() => mergeHotspots(curated, discovered), [curated, discovered]);

  const filteredHotspots = useMemo(() => {
    return hotspots.filter((item) => {
      const matchesCategory = selectedTag === 'All' || item.category === selectedTag;
      const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [hotspots, selectedTag, searchQuery]);

  if (meLoading || !me) {
    return (
      <div className="world-screen world-screen-loading" aria-busy="true">
        <div className="world-loading-map" />
        <div className="world-loading-card">
          <Icon name="compass" />
          <p role="status">Opening map</p>
        </div>
      </div>
    );
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

      <WorldHud
        me={me}
        rankProgress={presentation.rankProgress}
        energy={energy}
        gold={gold}
        gems={gems}
        onOpenNotifications={() => { playTap(); setNotificationsOpen((open) => !open); }}
      />

      <AnimatePresence>
        {notificationsOpen && (
          <motion.div
            className="notification-popover"
            style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 168px)', right: '24px' }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div>
              <strong>Notifications</strong>
              <button type="button" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}>×</button>
            </div>
            {unreadNotifications.length === 0 && (notifications || []).length === 0 ? (
              <p style={{ padding: '10px', color: 'var(--quest-muted)', fontSize: '0.85rem' }}>No notifications yet.</p>
            ) : (
              (notifications || []).slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={!n.readAt ? 'unread' : ''}
                  onClick={() => { if (!n.readAt) markNotificationRead.mutate(n.id); }}
                >
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Satellite Terrain Map & Pin Canvas */}
      <WorldCanvas
        phase={phase}
        weather={weather}
        hotspots={filteredHotspots}
        userPosition={lastKnownPosition}
        onSelectHotspot={handleSelectHotspot}
      />

      <button
        type="button"
        className="map-control-btn map-control-locate"
        aria-label="Locate me"
        onClick={() => {
          playTap();
          if (lastKnownPosition) {
            setSelectedHotspot({
              id: 'current-position',
              title: 'Your current area',
              category: 'Explorer position',
              region: 'Location is approximate',
              description: 'Wild Realm uses this only to sort nearby hotspots and discoveries.',
            });
          }
        }}
        disabled={!lastKnownPosition}
      >
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
          {hotspotsLoading ? (
            <div className="explore-hotspot-empty" aria-busy="true">
              <p role="status">Charting nearby nature…</p>
            </div>
          ) : hotspotsError ? (
            <div className="explore-hotspot-empty" role="alert">
              <p>Nearby locations couldn’t be loaded.</p>
              <p>
                <button type="button" className="explore-hotspot-retry" onClick={() => { playTap(); refetchHotspots(); }}>
                  Try again
                </button>
              </p>
            </div>
          ) : filteredHotspots.length > 0 ? (
            filteredHotspots.map((place) => (
              <motion.button
                type="button"
                key={place.id}
                className={`explore-hotspot-card ${place.element ? `element-${place.element.toLowerCase()}` : `category-${place.category.toLowerCase()}`}`}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { playTap(); setSelectedHotspot(place); }}
              >
                <div className="explore-hotspot-overlay">
                  {/* Curated places carry a category chip; the player's own
                      capture clusters carry their best rarity grade. */}
                  {place.source === 'discovered' ? (
                    <span className={`explore-hotspot-grade rank-hex-${place.grade.toLowerCase()}`}>{place.grade}</span>
                  ) : (
                    <span className="explore-hotspot-chip">{place.category}</span>
                  )}
                  <h4 className="explore-hotspot-title">{place.title}</h4>
                  <div className="explore-hotspot-meta">
                    <span>
                      {place.source === 'discovered'
                        ? `${place.discoveries} discover${place.discoveries === 1 ? 'y' : 'ies'}`
                        : place.region || place.category}
                    </span>
                    {place.distanceLabel && <span className="explore-hotspot-rating">{place.distanceLabel}</span>}
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="explore-hotspot-empty">
              <p>{hotspots.length === 0 ? 'No locations charted yet.' : `No ${selectedTag.toLowerCase()} locations match.`}</p>
              <p>
                {hotspots.length === 0
                  ? 'Capture a discovery to start mapping your area.'
                  : 'Try a different category or search term.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedHotspot && (
          <motion.div
            className="explore-hotspot-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotspot-detail-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <div className="explore-hotspot-detail-head">
              <div>
                <h3 id="hotspot-detail-title">{selectedHotspot.title}</h3>
                <p>
                  {selectedHotspot.category}
                  {selectedHotspot.region ? ` · ${selectedHotspot.region}` : ''}
                  {selectedHotspot.distanceLabel ? ` · ${selectedHotspot.distanceLabel}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => { playTap(); setSelectedHotspot(null); }} aria-label="Close location details">×</button>
            </div>

            {selectedHotspot.description && <p className="explore-hotspot-detail-body">{selectedHotspot.description}</p>}

            {selectedHotspot.featuredSpecies?.length > 0 && (
              <div className="explore-hotspot-species">
                <small>Likely finds</small>
                <div>
                  {selectedHotspot.featuredSpecies.map((id) => {
                    const entry = (species || []).find((s) => s.id === id);
                    return <span key={id} className="explore-hotspot-species-chip">{entry?.commonName || id}</span>;
                  })}
                </div>
              </div>
            )}

            {selectedHotspot.source === 'discovered' && (
              <p className="explore-hotspot-detail-body">
                {selectedHotspot.discoveries} of your discoveries came from here.
              </p>
            )}

            <div className="explore-hotspot-detail-actions">
              <button
                type="button"
                className="continue-journey-btn"
                onClick={() => { playTap(); setSelectedHotspot(null); window.dispatchEvent(new CustomEvent('wild-realm-open-capture')); }}
              >
                Capture here <span>→</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      </AnimatePresence>
    </motion.div>
  );
}
