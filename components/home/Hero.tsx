import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import { MainDescription } from '../marketing/Text';

const Hero = () => {
  return (
    <Fragment>
      <div className="mt-20 flex items-center justify-center px-4">
        <div className="flex max-w-6xl flex-col items-center">
          <div>
            <h1 className="text-center text-5xl font-bold tracking-tight text-balance text-oc sm:text-6xl md:text-7xl md:font-extrabold">
              <FormattedMessage
                id="home.collaborativeMoneyManagement"
                defaultMessage="Collaborative Money Management"
              />
            </h1>
          </div>
          <div className="my-4 max-w-4xl sm:my-10">
            {/* maxWidth={['288px', '608px', '768px', null, '896px']} */}
            <MainDescription textAlign="center">
              <FormattedMessage
                id="home.collaborativeMoneyManagement.description"
                defaultMessage="We provide the infrastructure for effective financial coordination. Enabling organizations, groups and communities to build trust around money."
              />
            </MainDescription>
          </div>

          <NextIllustration
            display={[null, 'none']}
            width={320}
            height={589}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration-mobile.png"
          />
          <NextIllustration
            display={['none', 'block', 'none']}
            width={768}
            height={431}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration.png"
          />
          <NextIllustration
            display={['none', null, 'block', null, 'none']}
            width={978}
            height={610}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration.png"
          />
          <NextIllustration
            display={['none', null, null, null, 'block']}
            width={1014}
            height={619}
            alt="The future is collective."
            src="/static/images/new-home/budget-illustration.png"
          />
        </div>
      </div>
    </Fragment>
  );
};

export default Hero;
