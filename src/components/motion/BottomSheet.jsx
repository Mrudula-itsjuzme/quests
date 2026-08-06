import { motion, useAnimation, useDragControls } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function BottomSheet({ isOpen, onClose, children }) {
  const controls = useAnimation();
  const dragControls = useDragControls();

  useEffect(() => {
    if (isOpen) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
  }, [isOpen, controls]);

  if (!isOpen) return null;

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 500 || offset > 150) {
      onClose();
    } else {
      controls.start('visible');
    }
  };

  return createPortal(
    <motion.div
      className="bottom-sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="bottom-sheet"
        initial="hidden"
        animate={controls}
        exit="hidden"
        variants={{
          visible: { y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
          hidden: { y: '100%', transition: { type: 'spring', damping: 25, stiffness: 300 } },
        }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div
          className="bottom-sheet-grabber"
          onPointerDown={(e) => dragControls.start(e)}
        />
        <div className="bottom-sheet-content">
          {children}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
