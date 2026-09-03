import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../../components/Icon';
import { useAddCardToLibrary, useCaptureItem, useMe, useRenameCapture, useShareDiscovery, useSpecies } from '../quests/queries';
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

async function fileToOptimizedDataUrl(file) {
  if (!('createImageBitmap' in window)) return fileToDataUrl(file);
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    bitmap.close?.();
    return fileToDataUrl(file);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.82);
}

const ANTI_CHEAT_MESSAGES = {
  matches_existing_capture: 'This photo has already been captured. Try a genuinely new find.',
  velocity_exceeds_human_possible: "That location doesn't match your last capture. Check your location and try again.",
  multiple_integrity_flags: 'We couldn\'t verify this capture. Please retake the photo outdoors, live.',
};

// Real CSS photo filters (Instagram/Snapchat-style) — applied to preview via filter CSS
const CAPTURE_FILTERS = [
  { id: 'Auto', label: 'Auto', css: 'none', accent: '#f8eed6' },
  { id: 'Vivid', label: 'Vivid', css: 'saturate(1.5) contrast(1.08) brightness(1.02)', accent: '#35e596' },
  { id: 'Bloom', label: 'Bloom', css: 'brightness(1.12) saturate(1.18) contrast(0.92)', accent: '#ffd4da' },
  { id: 'Film', label: 'Film', css: 'saturate(0.9) contrast(0.96) sepia(0.2)', accent: '#f0ce70' },
  { id: 'Dawn', label: 'Dawn', css: 'brightness(1.1) saturate(1.1) sepia(0.22) hue-rotate(-8deg)', accent: '#ff9a76' },
  { id: 'Mist', label: 'Mist', css: 'brightness(1.16) saturate(0.78) contrast(0.82)', accent: '#c7ddff' },
  { id: 'Glow', label: 'Glow', css: 'brightness(1.14) saturate(1.2) contrast(0.94)', accent: '#d9ff72' },
  { id: 'Crisp', label: 'Crisp', css: 'contrast(1.2) saturate(1.1) brightness(1.02)', accent: '#9cf4ff' },
  { id: 'Forest', label: 'Forest', css: 'saturate(1.24) contrast(1.05) hue-rotate(10deg) brightness(0.96)', accent: '#64f0a2' },
  { id: 'Dream', label: 'Dream', css: 'brightness(1.08) saturate(1.26) contrast(0.88) hue-rotate(-12deg)', accent: '#d8b4fe' },
  { id: 'Fade', label: 'Fade', css: 'brightness(1.1) saturate(0.72) contrast(0.86)', accent: '#c9c2ae' },
  { id: 'Noir', label: 'Noir', css: 'grayscale(1) contrast(1.2) brightness(1.04)', accent: '#ffffff' },
];

function messageForRejection(reason) {
  return ANTI_CHEAT_MESSAGES[reason] || "We couldn't verify this capture. Please retake the photo.";
}

function triggerHaptic(pattern = [15, 30, 15]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}

export function CaptureFlow({ onClose }) {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();
  const inputRef = useRef(null);
  const [stage, setStage] = useState('prompt'); // prompt | scanning | candidates | reveal | error
  const [card, setCard] = useState(null);
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingBundle, setPendingBundle] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [activeFilter, setActiveFilter] = useState('Auto');
  const { videoRef, status: cameraStatus } = useCameraPreview(stage === 'prompt');
  const captureItem = useCaptureItem();
  const addCardToLibrary = useAddCardToLibrary();
  const renameCapture = useRenameCapture();
  const shareDiscovery = useShareDiscovery();
  const { data: me } = useMe();
  const { data: species } = useSpecies();

  const currentFilter = CAPTURE_FILTERS.find((f) => f.id === activeFilter) || CAPTURE_FILTERS[0];

  const cycleFilter = () => {
    const currentIndex = CAPTURE_FILTERS.findIndex((filter) => filter.id === activeFilter);
    const next = CAPTURE_FILTERS[(currentIndex + 1) % CAPTURE_FILTERS.length];
    setActiveFilter(next.id);
    triggerHaptic([8]);
  };

  const openLibrary = () => {
    playTap();
    onClose();
    navigate('/app/library');
  };

  const persistCardEdits = async () => {
    if (!card?.id) return card;
    const patch = {};
    const nextTitle = name.trim();
    if (nextTitle && nextTitle !== card.cardTitle) patch.cardTitle = nextTitle;
    if (notes.trim() !== (card.notes || '')) patch.notes = notes.trim() || null;
    if (!Object.keys(patch).length) return card;
    const updated = await renameCapture.mutateAsync({ captureId: card.id, ...patch });
    setCard(updated);
    return updated;
  };

  const submitCapture = async (bundle) => {
    if (captureItem.isPending) return;
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
      setNotes('');
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
    const [dataUrl, telemetry] = await Promise.all([fileToOptimizedDataUrl(file), collectCaptureTelemetry(file)]);
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

  const handleLivePreviewCapture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return false;

    const canvas = document.createElement('canvas');
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return false;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setStage('scanning');
    setErrorMessage('');
    setPreviewUrl(dataUrl);

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
    const telemetry = await collectCaptureTelemetry(file);
    await submitCapture({
      captureId: crypto.randomUUID(),
      imageBase64: dataUrl,
      capturedAt: telemetry.capturedAt,
      gps: telemetry.gps,
      heading: telemetry.heading,
      liveness: telemetry.liveness,
      exif: telemetry.exif,
    });
    return true;
  };

  const handleNativeCamera = async () => {
    if (captureItem.isPending) return;
    if (cameraStatus === 'live' && await handleLivePreviewCapture()) return;

    if (isNative) {
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
          const [dataUrl, telemetry] = await Promise.all([fileToOptimizedDataUrl(file), collectCaptureTelemetry(file)]);
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
        }
      } catch {
        // User likely cancelled
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
    try { await persistCardEdits(); } catch { /* save still confirms the server-minted card */ }
    if (card?.id) {
      try {
        await addCardToLibrary.mutateAsync(card.id);
      } catch {
        window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'Your discovery was saved, but Library confirmation failed. Try again from Collection.' }));
      }
    }
    onClose();
  };

  const handleShare = async ({ caption } = {}) => {
    playTap();
    if (!card || shareDiscovery.isPending) return;
    try {
      const updatedCard = await persistCardEdits();
      await shareDiscovery.mutateAsync({ cardId: updatedCard.id, caption: caption || notes.trim() || undefined });
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
      {/* Global close button */}
      <button type="button" className="capture-flow-close" aria-label="Close" onClick={() => { playTap(); onClose(); }}>
        <Icon name="plus" />
      </button>

      <AnimatePresence mode="wait">
        {/* ── VIEWFINDER (prompt stage) ── */}
        {stage === 'prompt' && (
          <motion.div
            key="prompt"
            className="capture-viewfinder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Full-bleed camera feed */}
            <video
              ref={videoRef}
              className={`capture-viewfinder-video${cameraStatus === 'live' ? ' is-live' : ''}`}
              style={!isNative && currentFilter.css !== 'none' ? { filter: currentFilter.css } : undefined}
              playsInline
              muted
              autoPlay
              aria-hidden="true"
            />
            {!isNative && <div className={`capture-filter-aura filter-${activeFilter.toLowerCase()}`} aria-hidden="true" />}
            <div className="capture-viewfinder-vignette" aria-hidden="true" />

            {/* Top HUD */}
            <div className="capture-viewfinder-top">
              <div className="capture-player-badge" aria-label={`Level ${me?.level ?? 1} explorer`}>
                <span className="capture-player-avatar">{(me?.displayName || 'D').slice(0, 1)}</span>
                <span>
                  <strong>Level {me?.level ?? 1}</strong>
                  <small>{(me?.totalXp ?? 0).toLocaleString()} XP</small>
                </span>
              </div>
              <div className="capture-brand-title">Wild Realm</div>
              <span className="capture-top-spacer" aria-hidden="true" />
            </div>

            <div className="capture-social-rail" aria-label="Camera quick actions">
              <button type="button" className="capture-rail-btn" aria-label="Next filter" title="Next filter" onClick={() => { playTap(); cycleFilter(); }}>
                <Icon name="rotate" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="capture-viewfinder-bottom">
              <div className="capture-focus-pill" aria-live="polite">
                <span className="capture-focus-dot" style={{ background: currentFilter.accent }} aria-hidden="true" />
                <span>{currentFilter.label}</span>
              </div>

              {/* Real photo-filter strip (Instagram/Snap style) */}
              <div className="capture-filter-strip" aria-label="Camera filters">
                {CAPTURE_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`capture-filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
                    aria-pressed={activeFilter === filter.id}
                    aria-label={activeFilter === filter.id ? `Capture photo with ${filter.label}` : `Select ${filter.label} filter`}
                    onClick={(event) => {
                      playTap();
                      event.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                      if (activeFilter === filter.id) {
                        triggerHaptic([12]);
                        handleNativeCamera();
                        return;
                      }
                      setActiveFilter(filter.id);
                    }}
                    title={filter.id}
                    style={{ '--filter-accent': filter.accent }}
                  >
                    <span
                      className={`capture-filter-preview filter-${filter.id.toLowerCase()}`}
                      style={{ filter: filter.css !== 'none' ? filter.css : undefined }}
                      aria-hidden="true"
                    />
                    <span className="capture-filter-label">{filter.label}</span>
                  </button>
                ))}
              </div>

              <div className="capture-corner-controls">
                <button
                  type="button"
                  className="capture-side-btn"
                  aria-label="Close capture"
                  onClick={() => { playTap(); onClose(); }}
                >
                  <Icon name="plus" />
                </button>

                <button
                  type="button"
                  className="capture-side-btn"
                  aria-label="Open your library"
                  onClick={openLibrary}
                >
                  <Icon name="book" />
                </button>
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

        {/* ── SCANNING ── */}
        {stage === 'scanning' && (
          <motion.div
            key="scanning"
            className="capture-scanning-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {previewUrl && (
              <img
                className="capture-scanning-photo"
                src={previewUrl}
                alt=""
                aria-hidden="true"
                style={{ filter: currentFilter.css !== 'none' ? currentFilter.css : undefined }}
              />
            )}
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

        {/* ── CANDIDATES ── */}
        {stage === 'candidates' && (
          <motion.div
            key="candidates"
            className="capture-flow-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <h2>Which one is it?</h2>
            <p>We're not fully sure — pick the closest match, or retake the photo.</p>
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

        {/* ── ERROR ── */}
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

        {/* ── REVEAL ── */}
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
              imageFilter={currentFilter.css}
              isNew
              titleValue={name}
              onTitleChange={setName}
              notesValue={notes}
              onNotesChange={setNotes}
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
