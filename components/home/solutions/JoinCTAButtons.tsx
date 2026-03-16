import React from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Link from '@/components/Link';
import { Button } from '@/components/ui/Button';

interface JoinCTAButtonsProps {
  onPage: 'pricing' | 'solutions';
}

const StaticJoinCTAButtons = React.forwardRef<HTMLDivElement, JoinCTAButtonsProps>((props, ref) => {
  return (
    <div ref={ref} className="flex flex-col gap-4 sm:flex-row">
      <Button asChild variant="marketing" className="rounded-full whitespace-nowrap" size="lg">
        <Link href="/signup/organization?active=true">
          <FormattedMessage defaultMessage="Create Organization Account" id="solutions.hero.joinAsOrg" />
        </Link>
      </Button>
      <Button asChild variant="outline" className="rounded-full whitespace-nowrap" size="lg">
        <Link
          href={props.onPage === 'pricing' ? '/organizations' : '/organizations/pricing'}
          className="flex items-center gap-2"
        >
          {props.onPage === 'pricing' ? (
            <FormattedMessage defaultMessage="See Features" id="Hm2JMp" />
          ) : (
            <FormattedMessage defaultMessage="See Pricing" id="solutions.hero.seePricing" />
          )}
          <ArrowRight size={16} />
        </Link>
      </Button>
    </div>
  );
});

const FloatingJoinCTA: React.FC<
  JoinCTAButtonsProps & {
    isVisible: boolean;
  }
> = ({ isVisible, onPage }) => {
  return (
    <div className="fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2">
      <motion.div
        variants={{ visible: { y: 0, opacity: 100 }, hidden: { y: 300, opacity: 0 } }}
        initial={'hidden'}
        animate={isVisible ? 'visible' : 'hidden'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="mx-4 max-w-sm rounded-full border border-slate-200 bg-white/40 p-2 shadow-lg backdrop-blur-md sm:max-w-none"
      >
        <StaticJoinCTAButtons onPage={onPage} />
      </motion.div>
    </div>
  );
};

export const JoinCTAButtons: React.FC<JoinCTAButtonsProps> = ({ onPage }) => {
  const staticButtonsRef = React.useRef(null);
  const isStaticButtonsInView = useInView(staticButtonsRef, {
    amount: 0.1,
  });

  return (
    <React.Fragment>
      <StaticJoinCTAButtons ref={staticButtonsRef} onPage={onPage} />
      <FloatingJoinCTA isVisible={!isStaticButtonsInView} onPage={onPage} />
    </React.Fragment>
  );
};