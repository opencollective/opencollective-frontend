import React from 'react';
import { motion } from 'framer-motion';
import { FormattedMessage, useIntl } from 'react-intl';

import Image from '../Image';

const Hero = () => {
  const intl = useIntl();
  return (
    <div className="mt-20 flex items-center justify-center px-4">
      <div className="flex max-w-6xl flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="text-center text-5xl font-bold tracking-tight text-balance text-oc sm:text-6xl md:text-7xl md:font-extrabold">
            <FormattedMessage id="home.collaborativeMoneyManagement" defaultMessage="Collaborative Money Management" />
          </h1>
        </motion.div>
        <div className="my-4 max-w-4xl space-y-6 sm:my-10 sm:space-y-16">
          <motion.p
            className="text-center text-balance text-slate-800 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <FormattedMessage
              id="home.collaborativeMoneyManagement.description"
              defaultMessage="We provide the infrastructure for effective financial coordination. Enabling organizations, groups and communities to build trust around money."
            />
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            <Image
              src="/static/images/hero-illustration.png"
              width={2586}
              height={1597}
              alt={intl.formatMessage({
                defaultMessage: 'Collaborative Money Management',
                id: 'home.collaborativeMoneyManagement',
              })}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
