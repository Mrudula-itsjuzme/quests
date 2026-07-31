import { motion } from 'framer-motion';
import { Icon } from '../Icon';

export function IntentionalEmptyState({ icon = 'scroll', title = 'Path Clear', description = 'No active items at this time.', actionLabel, onAction }) {
  return (
    <motion.div
      className="intentional-empty-state"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="empty-icon-wrapper"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <Icon name={icon} />
      </motion.div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && (
        <motion.button
          type="button"
          className="gold-button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAction}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
