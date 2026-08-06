import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useActiveQuests, useCollectibles, useMe } from '../quests/queries';
import { deriveGold, deriveGems, getEnergy } from '../../lib/playerEconomy';
import { derivePlayerPresentation } from '../../lib/playerPresentation';
import { timeOfDayPhase } from '../../lib/worldTime';
import { WorldCanvas } from './WorldCanvas';
import { WorldHud } from './WorldHud';
import { CompassButton } from './CompassButton';
import { RadialMenu } from './RadialMenu';
import { CaptureButton } from './CaptureButton';
import { CaptureFlow } from './CaptureFlow';
import { pickWeather } from './WeatherLayer';
import { playTap } from '../../lib/useSoundEffects';

export function WorldScreen() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: quests } = useActiveQuests();
  const { data: collectibles } = useCollectibles();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [entering, setEntering] = useState(null);

  const phase = useMemo(() => timeOfDayPhase(new Date().getHours()), []);
  const weather = useMemo(() => pickWeather(), []);

  const activeQuests = quests || [];
  const presentation = useMemo(
    () => derivePlayerPresentation(me, activeQuests, [], collectibles || []),
    [me, activeQuests, collectibles],
  );
  const gold = deriveGold(me?.totalXp);
  const gems = deriveGems(collectibles);
  const energy = getEnergy();

  const notify = (detail) => window.dispatchEvent(new CustomEvent('habbit-notice', { detail }));

  const handleEnterBuilding = (building) => {
    setEntering(building.id);
    window.setTimeout(() => navigate(building.to), 320);
  };

  if (meLoading || !me) {
    return <div className="world-screen world-screen-loading" aria-busy="true" />;
  }

  return (
    <motion.div
      className="world-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="world-screen-stage"
        animate={entering ? { scale: 1.3, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <WorldCanvas
          phase={phase}
          weather={weather}
          avatarInitial={(me.displayName || 'S')[0].toUpperCase()}
          avatarTitle={presentation.rank}
          onEnterBuilding={handleEnterBuilding}
        />
      </motion.div>

      <WorldHud
        me={me}
        rankProgress={presentation.rankProgress}
        energy={energy}
        gold={gold}
        gems={gems}
        onOpenNotifications={() => notify('No new notices. Your path is clear.')}
      />

      <CaptureButton onOpen={() => { playTap(); setCaptureOpen(true); }} />

      <CompassButton open={menuOpen} onToggle={() => setMenuOpen((value) => !value)} />

      <AnimatePresence>
        {menuOpen && (
          <RadialMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onNavigate={(to) => { setMenuOpen(false); navigate(to); }}
            onOpenSettings={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('habbit-open-settings')); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {captureOpen && <CaptureFlow onClose={() => setCaptureOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
