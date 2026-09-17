import { PlaceDetail } from './PlaceDetail';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useActiveQuests, useCaptures, useCollectibles, useCommunityPosts, useMarkNotificationRead, useMe, useNotifications, useRateHotspot, useScenicPlaces, useSetHotspotSaved, useSpecies, useWorldHotspots } from '../quests/queries';
import { coinBalance, deriveGems, getEnergy } from '../../lib/playerEconomy';
import { derivePlayerPresentation } from '../../lib/playerPresentation';
import { timeOfDayPhase } from '../../lib/worldTime';
import { buildCommunityHotspots, buildDiscoveryHotspots, filterHotspotsNearOrigin, mapCuratedHotspots, mergeHotspots } from '../../lib/discoveryHotspots';
import { WorldCanvas } from './WorldCanvas';
import { WorldHud } from './WorldHud';
import { pickWeather } from './WeatherLayer';
import { playTap } from '../../lib/useSoundEffects';
import { Icon } from '../../components/Icon';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { CaptureImage } from '../../components/CaptureImage';
import { Search } from 'lucide-react';

const CATEGORIES = ['Places', 'Wildlife', 'Trails'];

export function WorldScreen() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: quests } = useActiveQuests();
  const { data: collectibles } = useCollectibles();
  const { data: notifications } = useNotifications();
  const { data: captures } = useCaptures();
  const { data: species } = useSpecies();
  const { data: communityPosts } = useCommunityPosts('public');
  const {
    data: worldHotspots,
    isLoading: hotspotsLoading,
    isError: hotspotsError,
    refetch: refetchHotspots,
  } = useWorldHotspots();
  const markNotificationRead = useMarkNotificationRead();
  const saveHotspot = useSetHotspotSaved();
  const rateHotspot = useRateHotspot();
  const navigate = useNavigate();
  const [lastKnownPosition, setLastKnownPosition] = useState(null);
  const [searchCenter, setSearchCenter] = useState(null);
  const nearbyCenter = searchCenter || lastKnownPosition;
  const { data: scenicPlaces, isFetching: scenicLoading, isError: scenicError } = useScenicPlaces(nearbyCenter);

  const [selectedTag, setSelectedTag] = useState('Places');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const handleSelectHotspot = useCallback((hotspot) => {
    playTap();
    setSelectedHotspot(hotspot);
  }, []);
  const handlePointMap = useCallback((point) => {
    playTap();
    setSearchCenter(point);
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
    let watchId = null;
    const fetchLocation = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permission = await Geolocation.checkPermissions();
          if (permission.location !== 'granted') {
            const request = await Geolocation.requestPermissions();
            if (request.location !== 'granted') return;
          }
          watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            (position) => {
              if (position) setLastKnownPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
          );
        } else {
          if (typeof navigator === 'undefined' || !navigator.geolocation) return;
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              setLastKnownPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
            () => {},
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
          );
        }
      } catch {
        // location error, degrade gracefully
      }
    };
    fetchLocation();
    return () => {
      if (watchId == null) return;
      if (Capacitor.isNativePlatform()) Geolocation.clearWatch({ id: watchId });
      else if (typeof navigator !== 'undefined' && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    };
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
  const scenic = useMemo(() => mapCuratedHotspots(scenicPlaces, nearbyCenter), [scenicPlaces, nearbyCenter]);
  const community = useMemo(() => buildCommunityHotspots(communityPosts, nearbyCenter), [communityPosts, nearbyCenter]);
  const hotspots = useMemo(() => {
    const merged = mergeHotspots([...scenic, ...community, ...curated], discovered);
    // Once a real location (or dropped pin) is known, do not keep unrelated
    // demo-city content in the nearby carousel or on the visible map.
    return filterHotspotsNearOrigin(merged, nearbyCenter);
  }, [scenic, community, curated, discovered, nearbyCenter]);

  const filteredHotspots = useMemo(() => {
    return hotspots.filter((item) => {
      const matchesCategory = selectedTag === 'Places' || (selectedTag === 'Wildlife' ? ['Birding', 'Fauna', 'Flora'].includes(item.category) : ['Trails', 'Parks', 'Viewpoints', 'Hotspots'].includes(item.category));
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
          <Search size={19} aria-hidden="true" />
          <input
            type="text"
            className="explore-search-input"
            aria-label="Search loaded places"
            placeholder="Search places on this map"
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
        onOpenProfile={() => { playTap(); navigate('/app/profile'); }}
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
        onPointMap={handlePointMap}
      />

      <div className="explore-map-tools" aria-live="polite">
        <p className="explore-location-state">
          {nearbyCenter
            ? scenicLoading
              ? 'Finding scenic places…'
              : scenicError
                ? 'Live scenic search is unavailable.'
                : `${scenic.length} places near you`
            : 'Location unavailable — tap the map to explore an area.'}
        </p>
      </div>

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

      {/* The fallback collection is featured, never falsely presented as nearby. */}
      <div className="explore-bottom-sheet">
        <div className="explore-sheet-header">
          <h3>{searchCenter ? 'Explore around your pin' : lastKnownPosition ? 'Top spots near you' : 'Featured destinations'}</h3>
          <button type="button" className="explore-sheet-see-all" onClick={() => navigate('/app/collection')}>
            See all ›
          </button>
        </div>

        <div className="explore-hotspot-cards" key={`${selectedTag}:${searchQuery}`}>
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
                style={{ '--hotspot-image': `url(${place.imageRef || imageForHotspot(place)})` }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { playTap(); setSelectedHotspot(place); }}
              >
                <CaptureImage className="explore-community-photo" imageRef={place.imageRef || imageForHotspot(place)} alt={place.title} useAuth={place.imageRef?.includes('/captures/')} />
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
                        : place.source === 'community'
                          ? `${place.discoveries} photo${place.discoveries === 1 ? '' : 's'} · ${place.contributor}`
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
                  : searchQuery ? 'Search filters the places loaded on this map. Tap another area to explore there.' : 'Try a different category.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedHotspot && <PlaceDetail
        place={selectedHotspot} species={species} image={selectedHotspot.imageRef || imageForHotspot(selectedHotspot)}
        onClose={() => setSelectedHotspot(null)}
        onCapture={() => { setSelectedHotspot(null); window.dispatchEvent(new CustomEvent('wild-realm-open-capture')); }}
        saving={saveHotspot.isPending} rating={rateHotspot.isPending}
        onSave={async () => {
          try { const social = await saveHotspot.mutateAsync({hotspotId:selectedHotspot.id,saved:!selectedHotspot.saved}); setSelectedHotspot(current=>current?{...current,...social}:current); }
          catch { window.dispatchEvent(new CustomEvent('habbit-notice',{detail:'Could not save this place. Please try again.'})); }
        }}
        onRate={async rating => {
          try { const social = await rateHotspot.mutateAsync({hotspotId:selectedHotspot.id,rating}); setSelectedHotspot(current=>current?{...current,...social}:current); }
          catch { window.dispatchEvent(new CustomEvent('habbit-notice',{detail:'Could not save your rating. Please try again.'})); }
        }}
      />}

    </motion.div>
  );
}

function imageForHotspot(place) {
  const text = `${place?.category || ''} ${place?.title || ''}`.toLowerCase();
  if (/bird|lake|hebbal/.test(text)) return '/assets/blue-billed-cuckoo.png';
  if (/water|falls|jog|shivana|athirap/.test(text)) return '/assets/verdant-explorer-banner.png';
  if (/park|cubbon|lalbagh|flower/.test(text)) return '/assets/verdant-explorer-banner.png';
  return '/assets/guest-library/mountains.jpg';
}
