import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';
import { FormattedMessage, FormattedHTMLMessage } from 'react-intl';

import Container from '../../Container';
import BackButton from '../BackButton';
import StyledLink from '../../StyledLink';
import { H1, P, H3 } from '../../Text';
import { Router } from '../../../server/pages';
import { addHostsData } from '../../HostsWithData';
import CollectiveCard from '../../CollectiveCard';

const HostsWrapper = styled(Flex)`
  overflow-x: auto;
`;

const SingleCollectiveWithoutBankAccount = ({ data }) => {
  let collectives = [];
  if (data.allHosts && data.allHosts.collectives) {
    collectives = [...data.allHosts.collectives];
  }

  return (
    <Container mx={3} my={4}>
      <Box display={['block', null, 'none']}>
        <BackButton onClick={() => Router.pushRoute('pricing')} />
      </Box>

      <Flex justifyContent="center">
        <Box textAlign={['center', null, 'left']} my={3} color="black.700" width={[1, null, '672px']}>
          <H1
            fontSize={['H3', null, 'H4']}
            textAlign="center"
            lineHeight={['40px', null, 'H4']}
            letterSpacing={['-0.4px', null, '-0.2px']}
          >
            <FormattedMessage id="pricing.tab.welcome" defaultMessage="Welcome!" />
          </H1>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedHTMLMessage
              id="pricing.tab.joinHost"
              defaultMessage="We invite you to <strong>join a Fiscal Host</strong>"
            />
          </P>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedHTMLMessage
              id="pricing.fiscalHost.description"
              defaultMessage="A Fiscal Host <strong>is an organization who offers fund-holding as a service.</strong> They keep your money in their bank account. Fiscal Hosts <strong>handle things like accounting, taxes, admin, payments, and liability-</strong>so you don’t have to!"
            />
          </P>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedHTMLMessage
              id="pricing.fiscalHost.reasonToJoin"
              defaultMessage="If you join a Fiscal Host, <strong>you don’t need to pay Open Collective,</strong> as your Collective is already included. Each Fiscal Host sets their own fees and acceptance criteria for Collectives."
            />
          </P>
          <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
            <FormattedMessage
              id="pricing.fiscalHost.applyOpenSource"
              defaultMessage="If you are an open source project, you can apply to join"
            />{' '}
            <StyledLink href="#">Open Source Collective.</StyledLink>
          </P>
        </Box>
      </Flex>
      <Container my={4} display="flex" flexDirection="column" alignItems="center">
        <H3
          color="black.700"
          textAlign="center"
          fontSize={['LeadParagraph']}
          lineHeight={['26px']}
          letterSpacing={['-0.008em']}
        >
          <FormattedMessage id="pricing.checkFiscalHost" defaultMessage="Check these Fiscal Hosts." />
        </H3>
        <HostsWrapper width={[1, null, '795px']} justifyContent="center" p={4}>
          {collectives.map(collective => (
            <Box mx={2} key={collective.id}>
              <CollectiveCard showApplyButton={true} width="185px" collective={collective} />
            </Box>
          ))}
        </HostsWrapper>
      </Container>
    </Container>
  );
};

SingleCollectiveWithoutBankAccount.propTypes = {
  data: PropTypes.object,
};

export default addHostsData(SingleCollectiveWithoutBankAccount);
