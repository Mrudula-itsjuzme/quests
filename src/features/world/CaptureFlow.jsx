import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { useAddCardToLibrary, useCaptureItem, useRenameCapture, useShareDiscovery, useSpecies } from '../quests/queries';
import { playTap } from '../../lib/useSoundEffects';
import { collectCaptureTelemetry } from '../../lib/captureTelemetry';
import { useCameraPreview } from '../../lib/useCameraPreview';
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
  const [previewUrl, setPreviewUrl] = useState('');
  // The viewfinder only runs while the player is composing a shot.
  const { videoRef, status: cameraStatus } = useCameraPreview(stage === 'prompt');
  const captureItem = useCaptureItem();
  const addCardToLibrary = useAddCardToLibrary();
  const renameCapture = useRenameCapture();
  const shareDiscovery = useShareDiscovery();
  const { data: species } = useSpecies();

  const submitCapture = async (bundle) => {
    if (captureItem.isPending) return; // Prevent duplicate submissions
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
    if (captureItem.isPending) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setStage('scanning');
    setErrorMessage('');
    const [dataUrl, telemetry] = await Promise.all([fileToDataUrl(file), collectCaptureTelemetry(file)]);
    setPreviewUrl(dataUrl);
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
    if (captureItem.isPending) return;
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
            className="capture-viewfinder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* The camera IS the environment — full-bleed, never inside a card. */}
            <video
              ref={videoRef}
              className={`capture-viewfinder-video${cameraStatus === 'live' ? ' is-live' : ''}`}
              playsInline
              muted
              autoPlay
              aria-hidden="true"
            />
            <div className="capture-viewfinder-vignette" aria-hidden="true" />

            <div className="capture-viewfinder-top">
              <div className="capture-locus">
                <Icon name="compass" />
                <span>{cameraStatus === 'live' ? 'Live' : 'Camera off'}</span>
              </div>
              <div className="capture-top-actions">
                <button type="button" className="capture-chip-btn" aria-label="Toggle flash">
                  <Icon name="bolt" />
                </button>
                <button
                  type="button"
                  className="capture-chip-btn"
                  aria-label="Close capture"
                  onClick={() => { playTap(); onClose(); }}
                >
                  <Icon name="plus" />
                </button>
              </div>
            </div>
            <div className="capture-reticle" aria-hidden="true">
              <span className="capture-bracket tl" />
              <span className="capture-bracket tr" />
              <span className="capture-bracket bl" />
              <span className="capture-bracket br" />
            </div>

            <div className="capture-viewfinder-bottom">
              <p className="capture-hint">Aim at a living subject and capture it live.</p>
              <div className="capture-controls">
                <button
                  type="button"
                  className="capture-side-btn"
                  aria-label="Open your library"
                  onClick={() => { playTap(); onClose(); }}
                >
                  <Icon name="book" />
                </button>

                <button
                  type="button"
                  className="capture-shutter"
                  aria-label="Capture photo"
                  onClick={() => { playTap(); triggerHaptic([12]); handleNativeCamera(); }}
                >
                  <span className="capture-shutter-ring" aria-hidden="true" />
                  <span className="capture-shutter-core" aria-hidden="true">
                    <Icon name="leaf" />
                  </span>
                </button>

                <span className="capture-side-btn is-placeholder" aria-hidden="true" />
              </div>
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
            className="capture-scanning-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* The subject stays on screen — the scan happens over the photo,
                not in an abstract panel, so the moment stays grounded. */}
            {previewUrl && <img className="capture-scanning-photo" src={previewUrl} alt="" aria-hidden="true" />}
            <div className="capture-viewfinder-vignette" aria-hidden="true" />

            <div className="capture-reticle is-scanning" aria-hidden="true">
              <span className="capture-bracket tl" />
              <span className="capture-bracket tr" />
              <span className="capture-bracket bl" />
              <span className="capture-bracket br" />
              <motion.span
                className="capture-scan-sweep"
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div className="capture-scan-panel" role="status" aria-live="polite">
              <span className="capture-scan-label">
                <span className="capture-scan-blip" aria-hidden="true" />
                Identifying subject
              </span>
              <p className="capture-scan-note">Checking the capture, then scoring its rarity.</p>
              <span className="capture-scan-track" aria-hidden="true">
                <motion.span
                  className="capture-scan-fill"
                  initial={{ scaleX: 0.05 }}
                  animate={{ scaleX: [0.05, 0.72, 0.9] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </span>
            </div>
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
              imageUrl={previewUrl}
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
