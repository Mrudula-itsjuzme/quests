import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { useAddCardToLibrary, useCaptureItem, useRenameCapture, useShareDiscovery, useSpecies } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { collectCaptureTelemetry } from '../../lib/captureTelemetry';
import { DiscoveryCard } from './DiscoveryCard';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ANTI_CHEAT_MESSAGES = {
  matches_existing_capture: 'This photo has already been captured by someone else. Try a genuinely new find.',
  velocity_exceeds_human_possible: 'That location doesn’t match your last capture. Check your location and try again.',
  multiple_integrity_flags: 'We couldn’t verify this capture. Please retake the photo outdoors, live.',
};

function messageForRejection(reason) {
  return ANTI_CHEAT_MESSAGES[reason] || 'We couldn’t verify this capture. Please retake the photo.';
}

function triggerHaptic(pattern = [15, 30, 15]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

export function CaptureFlow({ onClose }) {
  const inputRef = useRef(null);
  const [stage, setStage] = useState('prompt'); // prompt | scanning | candidates | reveal | error
  const [card, setCard] = useState(null);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingBundle, setPendingBundle] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const captureItem = useCaptureItem();
  const addCardToLibrary = useAddCardToLibrary();
  const renameCapture = useRenameCapture();
  const shareDiscovery = useShareDiscovery();
  const { data: species } = useSpecies();

  const submitCapture = async (bundle) => {
    triggerHaptic([20, 40, 20]);
    try {
      const result = await captureItem.mutateAsync(bundle);
      if (result.needsConfirmation) {
        setPendingBundle(bundle);
        setCandidates(result.candidates);
        setStage('candidates');
        return;
      }
      setCard(result);
      setName(result.cardTitle);
      setStage('reveal');
      triggerHaptic([40, 60, 40, 60, 100]);
    } catch (error) {
      triggerHaptic([80, 40, 80]);
      setErrorMessage(error?.code === 'anti_cheat_rejected' ? messageForRejection(error.reason) : 'The rarity engine could not read that photo. Try again.');
      setStage('error');
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStage('scanning');
    setErrorMessage('');
    const [dataUrl, telemetry] = await Promise.all([fileToDataUrl(file), collectCaptureTelemetry(file)]);
    await submitCapture({
      captureId: crypto.randomUUID(),
      imageBase64: dataUrl,
      capturedAt: telemetry.capturedAt,
      gps: telemetry.gps,
      heading: telemetry.heading,
      liveness: telemetry.liveness,
      exif: telemetry.exif,
    });
  };

  const handleNativeCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });
        if (image.webPath) {
          setStage('scanning');
          setErrorMessage('');
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          const [dataUrl, telemetry] = await Promise.all([fileToDataUrl(file), collectCaptureTelemetry(file)]);
          await submitCapture({
            captureId: crypto.randomUUID(),
            imageBase64: dataUrl,
            capturedAt: telemetry.capturedAt,
            gps: telemetry.gps,
            heading: telemetry.heading,
            liveness: telemetry.liveness,
            exif: telemetry.exif,
          });
        }
      } catch {
        // User likely cancelled the camera, do nothing to allow trying again
      }
    } else {
      inputRef.current?.click();
    }
  };

  const handlePickCandidate = async (index) => {
    playTap();
    setStage('scanning');
    await submitCapture({ ...pendingBundle, chosenCandidateIndex: index });
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
    if (card?.id) {
      try {
        await addCardToLibrary.mutateAsync(card.id);
      } catch {
        window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'Your discovery was saved, but Library confirmation failed. Try again from Collection.' }));
      }
    }
    onClose();
  };

  // Sharing publishes a real community post for this capture. The card is
  // already saved either way, so a failed share reports itself instead of
  // silently closing as if it had succeeded.
  const handleShare = async () => {
    playTap();
    if (!card || shareDiscovery.isPending) return;
    try {
      await shareDiscovery.mutateAsync({ cardId: card.id });
      window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'Shared to the community feed.' }));
      onClose();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('habbit-notice', {
        detail: error?.code === 'guest_write_unavailable'
          ? 'Guest mode is read-only. Sign in to share discoveries.'
          : 'Your discovery was saved, but sharing failed. Try again from Community.',
      }));
    }
  };

  return createPortal(
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
            className="capture-flow-prompt-ar"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="ar-hud-overlay">
              <div className="ar-bracket top-left" />
              <div className="ar-bracket top-right" />
              <div className="ar-bracket bottom-left" />
              <div className="ar-bracket bottom-right" />
              <div className="ar-center-reticle">
                <div className="ar-crosshair" />
              </div>
            </div>
            
            <div className="ar-prompt-content">
              <div className="ar-status-badge">
                <span className="ar-blip" /> SCANNER READY
              </div>
              <h2 className="ar-title">WILD ENCOUNTER</h2>
              <p className="ar-subtitle">Aim at a real-world object. The rarity engine will identify it and mint a card.</p>
              
              <button
                type="button"
                className="ar-shutter-btn"
                onClick={() => { playTap(); handleNativeCamera(); }}
              >
                <div className="ar-shutter-inner">
                  <Icon name="camera" />
                </div>
                <div className="ar-shutter-ring" />
              </button>
            </div>
            
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
            <div className="capture-scan-frame cinematic-scanner">
              <div className="scanner-bracket top-left"></div>
              <div className="scanner-bracket top-right"></div>
              <div className="scanner-bracket bottom-left"></div>
              <div className="scanner-bracket bottom-right"></div>
              
              <motion.div
                className="capture-scan-line"
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              
              <motion.div className="scanner-reticle"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 90] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              <div className="scanner-hud">
                <span className="hud-data">AI ANALYSIS: ACTIVE</span>
                <span className="hud-data right">LOCKED</span>
              </div>
            </div>
            <p className="scanner-text-pulse">Identifying and scoring rarity…</p>
          </motion.div>
        )}

        {stage === 'candidates' && (
          <motion.div
            key="candidates"
            className="capture-flow-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <h2>Which one is it?</h2>
            <p>We’re not fully sure — pick the closest match, or retake the photo.</p>
            <ul className="capture-candidate-list">
              {candidates.map((candidate, index) => (
                <li key={candidate.commonName}>
                  <button type="button" className="capture-candidate-option" onClick={() => handlePickCandidate(index)}>
                    <span className="capture-candidate-name">{candidate.commonName}</span>
                    <span className="capture-candidate-confidence">{Math.round(candidate.confidence * 100)}%</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="continue-journey-btn" onClick={() => setStage('prompt')}>
              Retake Photo
            </button>
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
            className="capture-flow-panel-clean"
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 1 }}
          >
            <DiscoveryCard
              card={card}
              species={species}
              isNew
              onAddToLibrary={handleConfirm}
              onShare={handleShare}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}
