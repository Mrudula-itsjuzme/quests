import { motion } from 'framer-motion';

/**
 * Premium Breathing Skeleton System
 * Content materializes progressively with golden shimmer sweeps and physical staggered entrance.
 */

export function SkeletonBox({
  width = '100%',
  height = '20px',
  borderRadius = '14px',
  className = '',
  style = {},
  delay = 0,
}) {
  return (
    <motion.div
      className={`skeleton-loader ${className}`}
      style={{ width, height, borderRadius, ...style }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="skeleton-breathing-bg" />
      <motion.div
        className="skeleton-gold-shimmer"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 1.8,
          ease: 'easeInOut',
          repeatDelay: 0.4,
        }}
      />
    </motion.div>
  );
}

/* ── 1. Dashboard Skeleton ─────────────────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div className="skeleton-layout dashboard-skel" aria-hidden="true">
      {/* Header skeleton */}
      <div className="skel-header">
        <SkeletonBox width="52px" height="52px" borderRadius="50%" delay={0.02} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="140px" height="24px" delay={0.05} />
          <SkeletonBox width="220px" height="14px" delay={0.08} />
        </div>
      </div>

      <div className="skel-main-grid">
        <div className="skel-left-col">
          {/* Hero Panorama */}
          <SkeletonBox height="220px" borderRadius="20px" delay={0.1} />

          {/* Today's Quests section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <SkeletonBox width="160px" height="20px" delay={0.15} />
            <SkeletonBox height="84px" borderRadius="16px" delay={0.18} />
            <SkeletonBox height="84px" borderRadius="16px" delay={0.22} />
            <SkeletonBox height="84px" borderRadius="16px" delay={0.26} />
          </div>

          {/* Daily Chest banner */}
          <SkeletonBox height="72px" borderRadius="16px" delay={0.3} style={{ marginTop: '16px' }} />
        </div>

        <div className="skel-right-rail">
          <SkeletonBox height="150px" borderRadius="18px" delay={0.12} />
          <SkeletonBox height="120px" borderRadius="18px" delay={0.16} />
          <SkeletonBox height="140px" borderRadius="18px" delay={0.2} />
        </div>
      </div>
    </div>
  );
}

/* ── 2. Quests Skeleton ───────────────────────────────────────────────── */
export function QuestsSkeleton() {
  return (
    <div className="skeleton-layout quests-skel" aria-hidden="true">
      {/* Header */}
      <div className="skel-header">
        <SkeletonBox width="52px" height="52px" borderRadius="50%" delay={0.02} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="120px" height="24px" delay={0.05} />
          <SkeletonBox width="180px" height="14px" delay={0.08} />
        </div>
      </div>

      {/* Focus Hero */}
      <SkeletonBox height="200px" borderRadius="20px" delay={0.1} />

      {/* Cadence Tabs */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0 16px' }}>
        <SkeletonBox width="90px" height="40px" borderRadius="12px" delay={0.14} />
        <SkeletonBox width="90px" height="40px" borderRadius="12px" delay={0.17} />
        <SkeletonBox width="110px" height="40px" borderRadius="12px" delay={0.2} />
      </div>

      {/* Content grid */}
      <div className="skel-main-grid">
        <div className="skel-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonBox height="76px" borderRadius="14px" delay={0.22} />
          <SkeletonBox height="76px" borderRadius="14px" delay={0.26} />
          <SkeletonBox height="76px" borderRadius="14px" delay={0.3} />
        </div>
        <div className="skel-right-rail">
          <SkeletonBox height="140px" borderRadius="18px" delay={0.24} />
          <SkeletonBox height="140px" borderRadius="18px" delay={0.28} />
        </div>
      </div>
    </div>
  );
}

/* ── 3. Rewards Skeleton ──────────────────────────────────────────────── */
export function RewardsSkeleton() {
  return (
    <div className="skeleton-layout rewards-skel" aria-hidden="true">
      {/* Header */}
      <div className="skel-header">
        <SkeletonBox width="52px" height="52px" borderRadius="50%" delay={0.02} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="130px" height="24px" delay={0.05} />
          <SkeletonBox width="200px" height="14px" delay={0.08} />
        </div>
      </div>

      {/* Season Hero Banner */}
      <SkeletonBox height="190px" borderRadius="20px" delay={0.1} />

      {/* 2x3 Panel Grid */}
      <div className="skel-rewards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
        <SkeletonBox height="150px" borderRadius="16px" delay={0.14} />
        <SkeletonBox height="150px" borderRadius="16px" delay={0.18} />
        <SkeletonBox height="150px" borderRadius="16px" delay={0.22} />
        <SkeletonBox height="150px" borderRadius="16px" delay={0.26} />
        <SkeletonBox height="150px" borderRadius="16px" delay={0.3} />
        <SkeletonBox height="150px" borderRadius="16px" delay={0.34} />
      </div>
    </div>
  );
}

/* ── 4. Gallery Skeleton ──────────────────────────────────────────────── */
export function GallerySkeleton() {
  return (
    <div className="skeleton-layout gallery-skel" aria-hidden="true">
      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <SkeletonBox width="160px" height="32px" delay={0.03} />
        <SkeletonBox width="340px" height="16px" delay={0.07} />
      </div>

      {/* Filter Segmented Control */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <SkeletonBox width="70px" height="36px" borderRadius="10px" delay={0.1} />
        <SkeletonBox width="70px" height="36px" borderRadius="10px" delay={0.13} />
        <SkeletonBox width="70px" height="36px" borderRadius="10px" delay={0.16} />
        <SkeletonBox width="90px" height="36px" borderRadius="10px" delay={0.19} />
      </div>

      {/* Journal Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <SkeletonBox height="88px" borderRadius="16px" delay={0.22} />
        <SkeletonBox height="88px" borderRadius="16px" delay={0.26} />
        <SkeletonBox height="88px" borderRadius="16px" delay={0.3} />
        <SkeletonBox height="88px" borderRadius="16px" delay={0.34} />
      </div>
    </div>
  );
}

/* ── 5. Guild Skeleton ────────────────────────────────────────────────── */
export function GuildSkeleton() {
  return (
    <div className="skeleton-layout guild-skel" aria-hidden="true">
      {/* Header */}
      <div className="skel-header">
        <SkeletonBox width="52px" height="52px" borderRadius="50%" delay={0.02} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="150px" height="24px" delay={0.05} />
          <SkeletonBox width="260px" height="14px" delay={0.08} />
        </div>
      </div>

      {/* Community Tabs */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0 16px' }}>
        <SkeletonBox width="130px" height="42px" borderRadius="12px" delay={0.12} />
        <SkeletonBox width="130px" height="42px" borderRadius="12px" delay={0.16} />
        <SkeletonBox width="110px" height="42px" borderRadius="12px" delay={0.2} />
      </div>

      {/* Feed Cards Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <SkeletonBox height="96px" borderRadius="16px" delay={0.24} />
        <SkeletonBox height="96px" borderRadius="16px" delay={0.28} />
        <SkeletonBox height="96px" borderRadius="16px" delay={0.32} />
      </div>
    </div>
  );
}

/* ── 6. Profile Skeleton ──────────────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div className="skeleton-layout profile-skel" aria-hidden="true">
      {/* Header */}
      <div className="skel-header">
        <SkeletonBox width="52px" height="52px" borderRadius="50%" delay={0.02} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SkeletonBox width="110px" height="24px" delay={0.05} />
          <SkeletonBox width="160px" height="14px" delay={0.08} />
        </div>
      </div>

      {/* Portrait & Level Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '16px' }}>
        <SkeletonBox height="280px" borderRadius="20px" delay={0.12} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <SkeletonBox height="130px" borderRadius="18px" delay={0.16} />
          <SkeletonBox height="70px" borderRadius="16px" delay={0.2} />
          <SkeletonBox height="110px" borderRadius="16px" delay={0.24} />
        </div>
      </div>

      {/* History & Statistics Panel Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '20px' }}>
        <SkeletonBox height="180px" borderRadius="18px" delay={0.28} />
        <SkeletonBox height="180px" borderRadius="18px" delay={0.32} />
        <SkeletonBox height="180px" borderRadius="18px" delay={0.36} />
      </div>
    </div>
  );
}
