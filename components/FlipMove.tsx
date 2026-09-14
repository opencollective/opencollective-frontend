import React, { Children, isValidElement } from 'react';
import type { HTMLMotionProps } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactElement, ReactNode } from 'react';

const DEFAULT_DURATION_MS = 350;

type FlipMoveProps = {
  children?: ReactNode;
  enterAnimation?: string;
  leaveAnimation?: string;
  disableAllAnimations?: boolean;
  duration?: number;
};

function getElementChildren(children: ReactNode): Array<ReactElement<HTMLMotionProps<'div'>>> {
  return Children.toArray(children).filter(isValidElement) as Array<ReactElement<HTMLMotionProps<'div'>>>;
}

/**
 * React 19-safe subset of react-flip-move: position FLIP plus optional fade
 * enter/leave. Direct children must be keyed host elements (e.g. `div`).
 */
export default function FlipMove({
  children,
  enterAnimation,
  leaveAnimation,
  disableAllAnimations = false,
  duration = DEFAULT_DURATION_MS,
}: FlipMoveProps) {
  const incoming = getElementChildren(children);
  const fadeEnter = enterAnimation === 'fade';
  const fadeLeave = leaveAnimation === 'fade';
  const transition = { duration: duration / 1000, ease: 'easeInOut' as const };

  if (disableAllAnimations) {
    return <div style={{ position: 'relative' }}>{incoming}</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence initial={false} mode="popLayout">
        {incoming.map(element => (
          <motion.div
            key={element.key}
            {...element.props}
            layout="position"
            initial={fadeEnter ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={fadeLeave ? { opacity: 0 } : undefined}
            transition={transition}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
