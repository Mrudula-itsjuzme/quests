import { useState } from 'react';
import { ApiError } from '../../lib/api';
import { Icon, categoryColors, categoryIcon } from '../../components/Icon';
import { ProgressBar, questProgressRatio, questStatusLabel } from './QuestCard';
import { usePostProgress, useSubmitProof } from './queries';
import { supabaseConfigured, uploadQuestProof } from '../../lib/supabase';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function QuestDetail({ quest }) {
  const postProgress = usePostProgress();
  const submitProof = useSubmitProof();
  const [textProof, setTextProof] = useState('');
  const [fileError, setFileError] = useState('');
  const [serviceMessage, setServiceMessage] = useState('');
  const [shareToFeed, setShareToFeed] = useState(true);

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
      announceCompletion(result, quest);
      if (!result.completed && result.proofsRemaining) setServiceMessage(`Proof accepted. ${result.proofsRemaining} more ${result.proofsRemaining === 1 ? 'submission' : 'submissions'} required.`);
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'provider_not_configured' || error.status === 503)) {
        setServiceMessage('Photo verification is not available yet. Your quest will stay pending for manual review once it launches.');
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
      announceCompletion(result, quest);
      setTextProof('');
    } catch {
      setServiceMessage('Could not submit your reflection. Please check the length and try again.');
    }
  };

  const onLogProgress = async (value) => {
    setServiceMessage('');
    try {
      const result = await postProgress.mutateAsync({ assignmentId: quest.id, value });
      announceCompletion(result, quest);
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'provider_not_configured' || error.status === 503)) {
        setServiceMessage('Automatic progress tracking is not available yet.');
      } else {
        setServiceMessage('Could not update progress. Please try again.');
      }
    }
  };

  return (
    <aside className="panel active-quest">
      <div className="panel-header">
        <div>
          <h2>Active Quest</h2>
          <span>{quest.cadence} quest</span>
        </div>
        <span className={`status-dot ${categoryColors[quest.category] || ''}`} aria-hidden="true" />
      </div>

      <div className="active-title">
        <span className={`quest-glyph ${categoryColors[quest.category] || ''}`} aria-hidden="true">
          <Icon name={categoryIcon(quest.category)} />
        </span>
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

      <ProgressBar value={ratio} label={`Progress ${quest.progressValue} / ${quest.targetValue} ${quest.unit}`} />

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
    </aside>
  );
}

function announceCompletion(result, quest) {
  if (!result?.completed) return;
  window.dispatchEvent(new CustomEvent('habbit-quest-completed', {
    detail: { quest, xp: result.xpCredited + result.bonusXp }
  }));
  window.dispatchEvent(new CustomEvent(result.levelUp ? 'habbit-level-up' : 'habbit-notice', {
    detail: result.levelUp
      ? { level: result.newLevel, tier: result.user?.tier, xp: result.xpCredited + result.bonusXp }
      : `${quest.title} complete — ${result.xpCredited + result.bonusXp} XP earned.`,
  }));
}
