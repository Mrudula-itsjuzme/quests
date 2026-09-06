import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiClient } from '../../lib/useApiClient';
import { playTap } from '../../lib/useSoundEffects';
import { Icon } from '../../components/Icon';
import { CaptureImage } from '../../components/CaptureImage';

export function ModerationQueue() {
  const queryClient = useQueryClient();
  const api = useApiClient();
  const { data: queue, isLoading } = useQuery({
    queryKey: ['admin', 'captures', 'review-queue'],
    queryFn: async () => {
      const res = await api.client.get('/admin/captures/review-queue');
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ captureId, decision, reason }) => {
      const res = await api.client.post(`/admin/captures/${captureId}/review`, { decision, reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'captures', 'review-queue']);
    },
  });

  if (isLoading) {
    return (
      <div className="moderation-queue loading" style={{ padding: '24px', textAlign: 'center', color: 'var(--quest-muted)' }}>
        <div className="startup-spinner"><div className="startup-spinner-dot"></div><div className="startup-spinner-dot"></div><div className="startup-spinner-dot"></div></div>
        <p>Loading queue...</p>
      </div>
    );
  }

  const pending = queue || [];

  return (
    <div className="moderation-queue" style={{ padding: '24px', color: 'var(--quest-text)', maxWidth: '800px', margin: '0 auto', paddingTop: 'max(env(safe-area-inset-top, 24px), 24px)' }}>
      <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Moderation Queue</h1>
        <div style={{ background: 'var(--quest-surface)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 'bold' }}>
          {pending.length} pending
        </div>
      </header>

      {pending.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--quest-surface)', borderRadius: '16px' }}>
          <Icon name="feather" />
          <p style={{ marginTop: '16px', color: 'var(--quest-muted)' }}>The queue is empty. Good job!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <AnimatePresence>
            {pending.map((capture) => (
              <motion.div
                key={capture.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: 'var(--quest-surface)',
                  border: '1px solid var(--quest-border)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                  <CaptureImage imageRef={capture.imageRef} alt={capture.itemName} useAuth />
                </div>
                
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600 }}>{capture.cardTitle}</h3>
                  <p style={{ margin: 0, color: 'var(--quest-muted)', fontSize: '0.85rem' }}>{capture.category}</p>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--quest-muted)' }}>
                  <div><strong>AI Confidence:</strong> {capture.confidence ? Math.round(capture.confidence * 100) + '%' : 'N/A'}</div>
                  <div><strong>Proposed Rank:</strong> {capture.rarityGrade} ({capture.rarityStars}★)</div>
                  {capture.gps && <div><strong>GPS:</strong> {capture.gps.lat.toFixed(4)}, {capture.gps.lng.toFixed(4)}</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--color-primary-green)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      playTap();
                      reviewMutation.mutate({ captureId: capture.id, decision: 'approve', reason: 'Looks good' });
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => {
                      playTap();
                      reviewMutation.mutate({ captureId: capture.id, decision: 'reject', reason: 'Does not meet guidelines' });
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
