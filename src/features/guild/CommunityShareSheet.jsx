import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useCaptures, useCommunityPosts, useShareDiscovery } from '../quests/queries';
import { playSuccess, playTap } from '../../lib/useSoundEffects';

const MAX_HASHTAGS = 8;

function parseHashtags(value) {
  return [...new Set(
    value
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#/, '').trim())
      .filter(Boolean)
      // Mirrors the server's hashtag rule so invalid input is caught before the
      // request rather than surfacing as a generic 400.
      .filter((tag) => /^[\p{L}\p{N}_]{1,40}$/u.test(tag)),
  )].slice(0, MAX_HASHTAGS);
}

/**
 * Sharing a discovery creates a real community post from a capture the player
 * actually owns — the server re-checks ownership and refuses rejected captures.
 */
export function CommunityShareSheet({ onClose, onShared }) {
  const { data: captures, isLoading, isError } = useCaptures();
  const { data: posts } = useCommunityPosts('public');
  const share = useShareDiscovery();
  const [selectedId, setSelectedId] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // A capture can only back one post, so already-shared and rejected captures
  // are filtered out instead of being offered and then refused.
  const sharedCardIds = useMemo(() => new Set((posts || []).map((post) => post.cardId).filter(Boolean)), [posts]);
  const shareable = useMemo(
    () => (captures || []).filter((card) => card.status !== 'rejected' && !sharedCardIds.has(card.id)),
    [captures, sharedCardIds],
  );

  const selected = shareable.find((card) => card.id === selectedId) || null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selected || share.isPending) return;
    setErrorMessage('');
    try {
      const post = await share.mutateAsync({
        cardId: selected.id,
        caption: caption.trim() || undefined,
        hashtags: parseHashtags(hashtagInput),
      });
      playSuccess();
      onShared?.(post);
      onClose();
    } catch (error) {
      setErrorMessage(
        error?.code === 'guest_write_unavailable'
          ? 'Guest mode is read-only. Sign in to share your discoveries.'
          : error?.code === 'capture_not_shareable'
            ? 'That capture failed verification and cannot be shared.'
            : 'Could not publish your post. Please try again.',
      );
    }
  };

  return createPortal(
    <motion.div
      className="modal-backdrop"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.form
        className="quest-modal community-share-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-discovery-title"
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 24, scale: 0.97 }}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="section-title">
          <h2 id="share-discovery-title">Share a discovery</h2>
          <button type="button" onClick={() => { playTap(); onClose(); }} aria-label="Close">×</button>
        </div>

        {isLoading && <p className="community-state-note" role="status">Loading your collection…</p>}
        {isError && <p className="community-state-note error" role="alert">We couldn’t load your captures. Please try again.</p>}

        {!isLoading && !isError && shareable.length === 0 && (
          <p className="community-state-note">
            You have no unshared discoveries yet. Capture something new, then share it here.
          </p>
        )}

        {shareable.length > 0 && (
          <>
            <fieldset className="community-share-picker">
              <legend>Choose a discovery</legend>
              <div className="community-share-options">
                {shareable.map((card) => (
                  <label key={card.id} className={`community-share-option ${selectedId === card.id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="cardId"
                      value={card.id}
                      checked={selectedId === card.id}
                      onChange={() => { playTap(); setSelectedId(card.id); }}
                    />
                    <span className={`community-share-rank rank-badge-${card.rarityStars || 1}`}>
                      {card.rarityStars || 1}★
                    </span>
                    <span className="community-share-name">{card.cardTitle || card.itemName}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="community-share-field">
              <span>Caption</span>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value.slice(0, 500))}
                maxLength={500}
                rows={3}
                placeholder="What made this find memorable?"
              />
              <small>{caption.length}/500</small>
            </label>

            <label className="community-share-field">
              <span>Hashtags</span>
              <input
                type="text"
                value={hashtagInput}
                onChange={(event) => setHashtagInput(event.target.value)}
                placeholder="birding westernghats"
              />
              <small>Up to {MAX_HASHTAGS}, separated by spaces.</small>
            </label>
          </>
        )}

        {errorMessage && <p className="community-state-note error" role="alert">{errorMessage}</p>}

        <div className="community-share-actions">
          <button type="button" className="discovery-btn-glass" onClick={() => { playTap(); onClose(); }}>
            Cancel
          </button>
          <button type="submit" className="discovery-btn-primary" disabled={!selected || share.isPending}>
            {share.isPending ? 'Publishing…' : 'Publish post'}
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  );
}
