import React from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import Link from '@/components/Link';
import { Button } from '@/components/ui/Button';

interface JoinCTAButtonsProps {
  onPage: 'pricing' | 'solutions' | 'collectives';
}

const StaticJoinCTAButtons = React.forwardRef<HTMLDivElement, JoinCTAButtonsProps>((props, ref) => {
  const primaryHref = props.onPage === 'collectives' ? '/create' : '/signup/organization?active=true';
  const primaryLabel =
    props.onPage === 'collectives' ? (
      <FormattedMessage defaultMessage="Create a Collective" id="collectives.hero.createCollective" />
    ) : (
      <FormattedMessage defaultMessage="Join As Organization" id="solutions.hero.joinAsOrg" />
    );

  let secondaryHref: string;
  let secondaryLabel: React.ReactNode;
  if (props.onPage === 'collectives') {
    secondaryHref = '/search?isHost=true';
    secondaryLabel = <FormattedMessage defaultMessage="Find a Fiscal Host" id="collectives.hero.findFiscalHost" />;
  } else if (props.onPage === 'pricing') {
    secondaryHref = '/organizations';
    secondaryLabel = <FormattedMessage defaultMessage="See Features" id="Hm2JMp" />;
  } else {
    secondaryHref = '/organizations/pricing';
    secondaryLabel = <FormattedMessage defaultMessage="See Pricing" id="solutions.hero.seePricing" />;
  }

  return (
    <div ref={ref} className="flex flex-col gap-4 sm:flex-row">
      <Button asChild variant="marketing" className="rounded-full whitespace-nowrap" size="lg">
        <Link href={primaryHref}>{primaryLabel}</Link>
      </Button>
      <Button asChild variant="outline" className="rounded-full whitespace-nowrap" size="lg">
        <Link href={secondaryHref} className="flex items-center gap-2">
          {secondaryLabel}
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
