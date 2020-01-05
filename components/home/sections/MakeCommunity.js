import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import { P } from '../../Text';
import Hide from '../../Hide';
import Illustration from '../HomeIllustration';
import HomePrimaryLink from '../HomePrimaryLink';
import SectionTitle from '../SectionTitle';
import SectionSubtitle from '../SectionSubtitle';

const MakeCommunity = () => (
  <Flex mx={[3, 4, null, 5, 6]} mt={5} mb={4} flexDirection={['column', 'row-reverse']}>
    <Flex width={[1, null]}>
      <Illustration
        alt="Make your community sustainable"
        display={['block', 'none', 'none']}
        src="/static/images/community-section-illustration.png"
      />
      <Illustration
        alt="Make your community sustainable"
        display={['none', 'block', null, null, 'none']}
        src="/static/images/community-section-illustration-md.png"
      />
      <Illustration
        alt="Make your community sustainable"
        display={['none', null, null, null, 'block']}
        src="/static/images/community-section-illustration-lg.png"
      />
    </Flex>
    <Flex flexDirection="column" width={[1, null]} alignItems={['center', 'flex-start']}>
      <SectionTitle textAlign="left" my={3}>
        <FormattedMessage id="home.makeCommunitySection.title" defaultMessage="Make your community sustainable" />
      </SectionTitle>
      <SectionSubtitle mb={4} color="black.700">
        <FormattedMessage
          id="home.makeCommunitySection.subTitle"
          defaultMessage="Collect and spend money for your community in a transparent way."
        />
      </SectionSubtitle>
      <Hide xs>
        <P
          fontSize={['13px', '15px']}
          fontWeight="500"
          color="black.800"
          mt={1}
          mb={4}
          letterSpacing="-0.012em"
          lineHeight={['19px', '25px']}
        >
          <FormattedMessage
            id="home.makeCommunitySection.description"
            defaultMessage="You don’t manage money in a community like you do in a private company. Open Collective lets you manage your finances in a transparent way so that everyone can see and trust that their money is put to good use."
          />
        </P>
      </Hide>
      <HomePrimaryLink href="#">
        <Hide xs>
          <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
        </Hide>
        <Hide sm md lg>
          <FormattedMessage id="home.create.opencollective" defaultMessage="Create an open collective" />
        </Hide>
      </HomePrimaryLink>
    </Flex>
  </Flex>
);

export default MakeCommunity;
