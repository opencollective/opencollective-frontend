import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Link from '@/components/Link';
import { Button } from '@/components/ui/Button';

export const JoinCTAButtons = React.forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div ref={ref} className="flex flex-col gap-4 sm:flex-row">
      <Button asChild variant="marketing" className="rounded-full whitespace-nowrap" size="lg">
        <Link href="/signup/organization?active=true">
          <FormattedMessage defaultMessage="Join As Organization" id="solutions.hero.joinAsOrg" />
        </Link>
      </Button>
      <Button asChild variant="outline" className="rounded-full whitespace-nowrap" size="lg">
        <Link href={props.linkToFeatures ? '/solutions' : '/pricing'} className="flex items-center gap-2">
          {props.linkToFeatures ? (
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

export const FloatingJoinCTA: React.FC<{
  isVisible: boolean;
}> = ({ isVisible }) => {
  return (
    <div className="fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2">
      <motion.div
        variants={{ visible: { y: 0, opacity: 100 }, hidden: { y: 300, opacity: 0 } }}
        initial={'hidden'}
        animate={isVisible ? 'visible' : 'hidden'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="mx-4 max-w-sm rounded-full border border-slate-200 bg-white/40 p-2 shadow-lg backdrop-blur-md sm:max-w-none"
      >
        <JoinCTAButtons />
      </motion.div>
    </div>
  );
};
