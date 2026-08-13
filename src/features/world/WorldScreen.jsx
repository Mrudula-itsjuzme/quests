import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useActiveQuests, useCaptures, useCollectibles, useMarkNotificationRead, useMe, useNotifications, useSpecies } from '../quests/queries';
import { coinBalance, deriveGems, getEnergy } from '../../lib/playerEconomy';
import { derivePlayerPresentation } from '../../lib/playerPresentation';
import { timeOfDayPhase } from '../../lib/worldTime';
import { buildDiscoveryHotspots } from '../../lib/discoveryHotspots';
import { WorldCanvas } from './WorldCanvas';
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
  const { data: notifications } = useNotifications();
  const { data: captures } = useCaptures();
  const { data: species } = useSpecies();
  const markNotificationRead = useMarkNotificationRead();
  const navigate = useNavigate();
  const [lastKnownPosition, setLastKnownPosition] = useState(null);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  useEffect(() => {
    const handleOpenCaptureEvent = () => {
      setCaptureOpen(true);
    };
    window.addEventListener('wild-realm-open-capture', handleOpenCaptureEvent);
    return () => window.removeEventListener('wild-realm-open-capture', handleOpenCaptureEvent);
  }, []);

  // Distances are only shown when the browser actually grants a position;
  // a denied or unavailable fix simply omits them.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return undefined;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!cancelled) setLastKnownPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
    return () => { cancelled = true; };
  }, []);

  // Hotspots are the player's own discovery locations. There is no places
  // provider wired up, so this maps real captures rather than inventing parks.
  const hotspots = useMemo(
    () => buildDiscoveryHotspots(captures, species, lastKnownPosition),
    [captures, species, lastKnownPosition],
  );

  const filteredHotspots = useMemo(() => {
    return hotspots.filter((item) => {
      const matchesCategory = selectedTag === 'All' || item.category === selectedTag;
      const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [hotspots, selectedTag, searchQuery]);

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
        onSelectHotspot={() => {
          playTap();
          // Hotspots are clusters of the player's own captures, so the pin
          // leads back into the collection that produced them.
          navigate('/app/collection');
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
          {filteredHotspots.length > 0 ? (
            filteredHotspots.map((place) => (
              <motion.button
                type="button"
                key={place.id}
                className={`explore-hotspot-card element-${place.element.toLowerCase()}`}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { playTap(); navigate('/app/collection'); }}
              >
                <div className="explore-hotspot-overlay">
                  <span className={`explore-hotspot-grade rank-hex-${place.grade.toLowerCase()}`}>{place.grade}</span>
                  <h4 className="explore-hotspot-title">{place.title}</h4>
                  <div className="explore-hotspot-meta">
                    <span>{place.discoveries} discover{place.discoveries === 1 ? 'y' : 'ies'}</span>
                    {place.distanceLabel && <span className="explore-hotspot-rating">{place.distanceLabel}</span>}
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="explore-hotspot-empty">
              <p>{hotspots.length === 0 ? 'No nearby hotspots yet.' : `No ${selectedTag.toLowerCase()} hotspots match.`}</p>
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
        {captureOpen && <CaptureFlow onClose={() => setCaptureOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

