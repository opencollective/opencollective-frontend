import React from 'react';
import styled from 'styled-components';
import { display } from 'styled-system';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import { Link } from '../../../server/pages';
import { P, H3 } from '../../Text';
import Illustration from '../HomeIllustration';
import HomePrimaryLink from '../HomePrimaryLink';
import Container from '../../Container';
import SectionTitle from '../SectionTitle';
import SectionSubTitle from '../SectionSubtitle';

const Title = styled(H3)`
  font-size: ${props => props.theme.fontSizes.LeadParagraph}px;
  line-height: 22px;
  letter-spacing: -0.008em;
  font-weight: bold;
  margin-bottom: 16px;
  margin-top: 16px;

  @media screen and (min-width: 64em) {
    font-size: ${props => props.theme.fontSizes.H5}px;
    line-height: 28px;
    letter-spacing: -0.2px;
  }
`;

const Description = styled(P)`
  font-size: 13px;
  line-height: 19px;
  letter-spacing: -0.012em;
  font-weight: 500;
  ${display}

  @media screen and (min-width: 88em) {
    font-size: 15px;
    line-height: 25px;
  }
`;

const WhatCanYouDo = () => (
  <Flex mx={[3, 4]} my={4} flexDirection="column" textAlign="center">
    <SectionTitle>
      <FormattedMessage id="home.whatCanYouDoSection.title" defaultMessage="What can you do on Open Collective?" />
    </SectionTitle>
    <SectionSubTitle>
      <FormattedMessage
        id="home.whatCanYouDoSection.subTitle"
        defaultMessage="Collect and spend money for your community in a transparent way."
      />
    </SectionSubTitle>
    <Flex mb={4} flexDirection={['column', 'row']} justifyContent={['none', 'space-evenly']}>
      <Flex flexDirection="column" alignItems="center" my={[null, 3]} width={[1, '288px', null, null, '370px']}>
        <Illustration
          src="/static/images/collectmoney-illustration.png"
          display={['block', null, null, null, 'none']}
          alt="Collect money"
        />
        <Illustration
          src="/static/images/collectmoney-illustration-lg.png"
          display={['none', null, null, null, 'block']}
          alt="Collect money"
        />
        <Title>
          <FormattedMessage id="home.whatCanYouDoSection.collectMoney" defaultMessage="Collect Money" />
        </Title>
        <Description display={['block', null, 'none']}>
          <FormattedMessage
            id="home.whatCanYouDoSection.collectMoney.shortDescription"
            defaultMessage="Collect money online by credit card or directly on your bank account and record it in your..."
          />
        </Description>
        <Description display={['none', null, 'block']}>
          <FormattedMessage
            id="home.whatCanYouDoSection.collectMoney.longDescription"
            defaultMessage="Collect money online by credit card or directly on your bank account and record it in your transparent budget. Define different ways people can contribute (one time or recurring donations, set up your own tiers)."
          />
        </Description>
      </Flex>
      <Flex flexDirection="column" alignItems="center" my={3} width={[1, '288px', null, null, '370px']}>
        <Illustration
          src="/static/images/spendmoney-illustration.png"
          display={['block', null, null, null, 'none']}
          alt="Spend money"
        />
        <Illustration
          src="/static/images/spendmoney-illustration-lg.png"
          display={['none', null, null, null, 'block']}
          alt="Spend money"
        />
        <Title>
          <FormattedMessage id="home.whatCanYouDoSection.spendMoney" defaultMessage="Spend Money" />
        </Title>
        <Description display={['block', null, 'none']}>
          <FormattedMessage
            id="home.whatCanYouDoSection.spendMoney.shortDescription"
            defaultMessage="You don’t manage money in a community like you do in a private company. Open..."
          />
        </Description>
        <Description display={['none', null, 'block']}>
          <FormattedMessage
            id="home.whatCanYouDoSection.spendMoney.longDescription"
            defaultMessage="Enable anyone in your community to submit their expenses. Once approved, reimburse them in one click with paypal or manually mark them as paid. All transactions are recorded publicly in your transparent budget (attachments are kept private to respect privacy)."
          />
        </Description>
      </Flex>
      <Flex flexDirection="column" alignItems="center" my={3} width={[1, '288px', null, null, '370px']}>
        <Illustration
          src="/static/images/managemoney-illustration.png"
          alt="Manage money"
          display={['block', null, null, null, 'none']}
        />
        <Illustration
          src="/static/images/managemoney-illustration-lg.png"
          alt="Manage money"
          display={['none', null, null, null, 'block']}
        />
        <Title>
          <FormattedMessage id="home.whatCanYouDoSection.manageMoney" defaultMessage="Manage Money" />
        </Title>
        <Description display={['block', null, 'none']}>
          <FormattedMessage
            id="home.whatCanYouDoSection.manageMoney.shortDescription"
            defaultMessage="You don’t manage money in a community like you do in a private company. Open..."
          />
        </Description>
        <Description display={['none', null, 'block']}>
          <FormattedMessage
            id="home.whatCanYouDoSection.manageMoney.longDescription"
            defaultMessage="You don’t manage money in a community like you do in a private company. Open Collective lets you manage your finances in a transparent way so that everyone can see and trust that their money is put to good use."
          />
        </Description>
      </Flex>
    </Flex>
    <Container display={['none', 'none', 'flex']} justifyContent="center" width={1}>
      <Link route="/create" passHref>
        <HomePrimaryLink>
          <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
        </HomePrimaryLink>
      </Link>
    </Container>
  </Flex>
);

export default WhatCanYouDo;
