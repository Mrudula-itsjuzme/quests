import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, categoryIcon } from '../../components/Icon';
import { useCaptureItem, useRenameCapture } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CaptureFlow({ onClose }) {
  const inputRef = useRef(null);
  const [stage, setStage] = useState('prompt'); // prompt | scanning | reveal | error
  const [card, setCard] = useState(null);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const captureItem = useCaptureItem();
  const renameCapture = useRenameCapture();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStage('scanning');
    setErrorMessage('');
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await captureItem.mutateAsync(dataUrl);
      setCard(result);
      setName(result.cardTitle);
      setStage('reveal');
    } catch {
      setErrorMessage('The rarity engine could not read that photo. Try again.');
      setStage('error');
    }
  };

  const handleConfirm = async () => {
    playTap();
    if (card && name.trim() && name.trim() !== card.cardTitle) {
      try {
        await renameCapture.mutateAsync({ captureId: card.id, cardTitle: name.trim() });
      } catch {
        // Card is already saved server-side under its original name; a failed rename isn't fatal to the capture.
      }
    }
    onClose();
  };

  return (
    <motion.div
      className="capture-flow-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Capture a moment"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" className="capture-flow-close" aria-label="Close" onClick={() => { playTap(); onClose(); }}>
        <Icon name="plus" />
      </button>

      <AnimatePresence mode="wait">
        {stage === 'prompt' && (
          <motion.div
            key="prompt"
            className="capture-flow-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <span className="capture-flow-icon"><Icon name="camera" /></span>
            <h2>Capture a moment</h2>
            <p>Point at something real. The rarity engine will identify it and mint a card.</p>
            <button
              type="button"
              className="continue-journey-btn"
              onClick={() => { playTap(); inputRef.current?.click(); }}
            >
              Open Camera <span>→</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleFile}
            />
          </motion.div>
        )}

        {stage === 'scanning' && (
          <motion.div
            key="scanning"
            className="capture-flow-panel capture-scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="capture-scan-frame">
              <motion.div
                className="capture-scan-line"
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p>Identifying and scoring rarity…</p>
          </motion.div>
        )}

        {stage === 'error' && (
          <motion.div
            key="error"
            className="capture-flow-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p>{errorMessage}</p>
            <button type="button" className="continue-journey-btn" onClick={() => setStage('prompt')}>
              Try Again
            </button>
          </motion.div>
        )}

        {stage === 'reveal' && card && (
          <motion.div
            key="reveal"
            className="capture-flow-panel"
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className={`capture-card-reveal rarity-${card.rarityTier.toLowerCase()}`}>
              <span className="capture-card-shine" aria-hidden="true" />
              <span className="capture-card-rarity">{card.rarityTier}</span>
              <span className="capture-card-icon"><Icon name={categoryIcon(card.category)} /></span>
              <span className="capture-card-item">{card.itemName}</span>
              {card.description && <p className="capture-card-desc">{card.description}</p>}
            </div>

            <label className="capture-name-field">
              <span>Card name</span>
              <input
                type="text"
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <button type="button" className="continue-journey-btn" onClick={handleConfirm}>
              Add to Library <span>→</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
