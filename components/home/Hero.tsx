import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import Image from '../Image';

const Hero = () => {
  const intl = useIntl();
  return (
    <div className="mt-20 flex items-center justify-center px-4">
      <div className="flex max-w-6xl flex-col items-center">
        <div>
          <h1 className="text-center text-5xl font-bold tracking-tight text-balance text-oc sm:text-6xl md:text-7xl md:font-extrabold">
            <FormattedMessage id="home.collaborativeMoneyManagement" defaultMessage="Collaborative Money Management" />
          </h1>
        </div>
        <div className="my-4 max-w-4xl space-y-6 sm:my-10 sm:space-y-16">
          <p className="text-center text-balance text-slate-800 sm:text-xl">
            <FormattedMessage
              id="home.collaborativeMoneyManagement.description"
              defaultMessage="We provide the infrastructure for effective financial coordination. Enabling organizations, groups and communities to build trust around money."
            />
          </p>
          <Image
            src="/static/images/hero-illustration.png"
            width={2586}
            height={1597}
            alt={intl.formatMessage({
              defaultMessage: 'Collaborative Money Management',
              id: 'home.collaborativeMoneyManagement',
            })}
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
