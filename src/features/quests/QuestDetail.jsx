import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ApiError } from '../../lib/api';
import { Icon, categoryColors, categoryIcon } from '../../components/Icon';
import { ProgressBar, questProgressRatio, questStatusLabel } from './QuestCard';
import { usePostProgress, useSubmitProof } from './queries';
import { supabaseConfigured, uploadQuestProof } from '../../lib/supabase';
import { FloatingXp } from '../../components/motion/FloatingXp';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function QuestDetail({ quest }) {
  const postProgress = usePostProgress();
  const submitProof = useSubmitProof();
  const [textProof, setTextProof] = useState('');
  const [fileError, setFileError] = useState('');
  const [serviceMessage, setServiceMessage] = useState('');
  const [shareToFeed, setShareToFeed] = useState(true);
  const [rewardBurst, setRewardBurst] = useState(null);

  if (!quest) {
    return (
      <aside className="panel active-quest empty-state">
        <p>Select a quest to see its details.</p>
      </aside>
    );
  }

  const ratio = questProgressRatio(quest);
  const canAct = quest.status === 'active' || quest.status === 'rejected';

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    setFileError('');
    setServiceMessage('');
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setFileError('Please choose a JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFileError('Photo must be smaller than 8MB.');
      return;
    }
    try {
      const uploadId = supabaseConfigured ? await uploadQuestProof(file) : `local_${crypto.randomUUID()}`;
      const result = await submitProof.mutateAsync({ assignmentId: quest.id, payload: { uploadId, feedOptIn: shareToFeed } });
      announceCompletion(result, quest, setRewardBurst);
      if (!result.completed && result.proofsRemaining) setServiceMessage(`Proof accepted. ${result.proofsRemaining} more ${result.proofsRemaining === 1 ? 'submission' : 'submissions'} required.`);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'guest_write_unavailable') {
        setServiceMessage('Sign in to submit verified quest proof.');
      } else if (error instanceof ApiError && (error.code === 'provider_not_configured' || error.status === 503)) {
        setServiceMessage('Photo review is temporarily unavailable. Please try again shortly.');
      } else {
        setServiceMessage('Could not submit your photo. Please try again.');
      }
    }
  };

  const onSubmitText = async (event) => {
    event.preventDefault();
    setServiceMessage('');
    try {
      const result = await submitProof.mutateAsync({ assignmentId: quest.id, payload: { text: textProof } });
      announceCompletion(result, quest, setRewardBurst);
      setTextProof('');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'guest_write_unavailable') {
        setServiceMessage('Sign in to submit verified quest proof.');
      } else {
        setServiceMessage('Could not submit your reflection. Please check the length and try again.');
      }
    }
  };

  const onLogProgress = async (value) => {
    setServiceMessage('');
    try {
      const result = await postProgress.mutateAsync({ assignmentId: quest.id, value });
      announceCompletion(result, quest, setRewardBurst);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'guest_write_unavailable') {
        setServiceMessage('Sign in to log verified quest progress.');
      } else if (error instanceof ApiError && (error.code === 'provider_not_configured' || error.status === 503)) {
        setServiceMessage('Could not update progress right now. Please try again.');
      } else {
        setServiceMessage('Could not update progress. Please try again.');
      }
    }
  };

  return (
    <motion.aside
      className="panel active-quest"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
    >
      <FloatingXp xp={rewardBurst?.xp || 0} isVisible={!!rewardBurst} onComplete={() => setRewardBurst(null)} />
      <div className="panel-header">
        <div>
          <h2>Active Quest</h2>
          <span>{quest.cadence} quest</span>
        </div>
        <span className={`status-dot ${categoryColors[quest.category] || ''}`} aria-hidden="true" />
      </div>

      <div className="active-title">
        <motion.span
          className={`quest-glyph ${categoryColors[quest.category] || ''}`}
          aria-hidden="true"
          animate={canAct ? { rotate: [0, -4, 4, 0], scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 3.2, repeat: canAct ? Infinity : 0, ease: 'easeInOut' }}
        >
          <Icon name={categoryIcon(quest.category)} />
        </motion.span>
        <div>
          <h3>{quest.title}</h3>
          <p>{quest.description}</p>
        </div>
      </div>

      <div className="step-list">
        <h4>Steps</h4>
        {(quest.instructions || []).map((instruction, index) => (
          <div key={instruction} className={index < Math.ceil(ratio * (quest.instructions.length || 1)) ? 'done' : ''}>
            <span aria-hidden="true" />
            <p>{instruction}</p>
          </div>
        ))}
      </div>

      <div className="verified-progress-shell">
        <ProgressBar value={ratio} label={`Progress ${quest.progressValue} / ${quest.targetValue} ${quest.unit}`} />
        <AnimatePresence>
          {(submitProof.isPending || postProgress.isPending) && (
            <motion.div
              className="verification-rune"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
            >
              <Icon name="compass" />
              <span>Verifying</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="detail-stats">
        <span>Status <strong>{questStatusLabel(quest)}</strong></span>
        <span>Reward XP <strong>{quest.xpReward}</strong></span>
      </div>

      {!canAct && (
        <p role="status" className="sync-status">
          {quest.status === 'completed' && 'XP already awarded for this quest.'}
          {quest.status === 'pending_verification' && 'Your submission is awaiting manual review.'}
          {quest.status === 'abandoned' && 'This quest is no longer active after repeated rejections.'}
          {quest.status === 'expired' && 'This quest has expired.'}
        </p>
      )}

      {canAct && quest.verificationType === 'AUTO' && (
        <button type="button" className="primary-action" onClick={() => onLogProgress(quest.progressValue + 1)} disabled={postProgress.isPending}>
          {postProgress.isPending ? 'Logging...' : 'Log progress'}
        </button>
      )}

      {canAct && quest.verificationType === 'TEXT' && (
        <form onSubmit={onSubmitText} className="proof-form">
          <label htmlFor="proof-text">Write your reflection (min 8 characters)</label>
          <textarea id="proof-text" value={textProof} onChange={(event) => setTextProof(event.target.value)} minLength={8} maxLength={10000} required />
          <button type="submit" className="primary-action" disabled={submitProof.isPending}>
            {submitProof.isPending ? 'Submitting...' : 'Submit proof'}
          </button>
        </form>
      )}

      {canAct && quest.verificationType === 'PHOTO' && (
        <div className="proof-form">
          <label htmlFor="proof-photo">Upload photo proof (JPEG/PNG/WEBP, up to 8MB)</label>
          <input id="proof-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} disabled={submitProof.isPending} />
          <label className="feed-opt-in"><input type="checkbox" checked={shareToFeed} onChange={(event) => setShareToFeed(event.target.checked)} /> Share this verified completion with the community</label>
          {fileError && <p role="alert" className="form-error">{fileError}</p>}
        </div>
      )}

      {serviceMessage && <p role="status" className="form-error">{serviceMessage}</p>}
    </motion.aside>
  );
}

function announceCompletion(result, quest, setRewardBurst) {
  if (!result?.completed) return;
  const xp = Number(result.xpCredited || 0) + Number(result.bonusXp || 0);
  setRewardBurst({ xp });
  window.dispatchEvent(new CustomEvent('habbit-quest-completed', {
    detail: { quest, xp, bonusXp: Number(result.bonusXp || 0), assignment: result.assignment }
  }));
  window.dispatchEvent(new CustomEvent(result.levelUp ? 'habbit-level-up' : 'habbit-notice', {
    detail: result.levelUp
      ? { level: result.newLevel, tier: result.user?.tier, xp }
      : `${quest.title} complete — ${xp} XP earned.`,
  }));
}
