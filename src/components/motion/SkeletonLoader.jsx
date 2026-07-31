import { motion } from 'framer-motion';

export function SkeletonBox({ width = '100%', height = '20px', className = '', style = {} }) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{ width, height, ...style }}
    >
      <motion.div
        className="skeleton-shimmer"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton-layout">
      <div className="skeleton-hero">
        <SkeletonBox height="180px" />
      </div>
      <div className="skeleton-grid">
        <SkeletonBox height="100px" />
        <SkeletonBox height="100px" />
        <SkeletonBox height="100px" />
      </div>
      <div className="skeleton-cards">
        <SkeletonBox height="70px" />
        <SkeletonBox height="70px" />
        <SkeletonBox height="70px" />
      </div>
    </div>
  );
}
