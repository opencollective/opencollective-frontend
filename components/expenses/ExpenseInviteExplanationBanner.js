import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Flex } from '../../components/Grid';
import StyledCard from '../../components/StyledCard';
import { H4, P } from '../../components/Text';

import pidgeon from '../../public/static/images/pidgeon.png';

const PidgeonIllustration = styled.img.attrs({ src: pidgeon })`
  width: 132px;
  height: 132px;
`;

const ExpenseInviteExplanationBanner = () => {
  return (
    <StyledCard py={3} px="26px" mb={4} borderStyle={'solid'} data-cy="expense-draft-banner">
      <Flex>
        <PidgeonIllustration alt="" />
        <Flex ml={[0, 2]} maxWidth="448px" flexDirection="column">
          <H4 mb="10px" fontWeight="500">
            <FormattedMessage defaultMessage="Invite to submit an expense" />
          </H4>
          <P lineHeight="20px">
            <FormattedMessage defaultMessage="When completing the form, an invitation to submit this expense will been sent. The recipient will need to confirm and complete the process on their side." />
          </P>
        </Flex>
      </Flex>
    </StyledCard>
  );
};

export default ExpenseInviteExplanationBanner;
