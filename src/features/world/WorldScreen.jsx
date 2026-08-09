import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useActiveQuests, useCollectibles, useMarkNotificationRead, useMe, useNotifications } from '../quests/queries';
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
  const { data: notifications } = useNotifications();
  const markNotificationRead = useMarkNotificationRead();
  const navigate = useNavigate();

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
  const gold = deriveGold(me?.totalXp);
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
        onSelectHotspot={(hotspot) => {
          playTap();
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
                whileHover={{ scale: 1.04, y: -4 }}
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
            <div style={{ textAlign: 'center', padding: '30px 20px', width: '100%', color: 'var(--wild-text-dim)', fontSize: '0.9rem' }}>
              <p style={{ margin: 0 }}>No nearby hotspots yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>Capture a discovery to start mapping your area.</p>
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

