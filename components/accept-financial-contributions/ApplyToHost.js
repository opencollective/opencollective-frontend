import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { defineMessages, injectIntl } from 'react-intl';

import umbrellaIllustration from '../../public/static/images/create-collective/umbrellaPot.png';
import climateIllustration from '../../public/static/images/create-collective/climateIllustration.png';
import { H1, H2, H3, P } from '../Text';
import Container from '../Container';
import StyledButton from '../StyledButton';
import ExternalLink from '../ExternalLink';
import HostCollectiveCard from './HostCollectiveCard';

const FISCAL_HOST_LINK = 'https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host';

const AllCardsContainer = styled(Flex).attrs({
  flexWrap: 'wrap',
  width: '60%',
  maxWidth: 1300,
  mx: 'auto',
  justifyContent: 'space-evenly',
})``;

const CollectiveCardContainer = styled.div`
  width: 280px;
  padding: 20px 15px;
`;

const InterestedContainer = styled(Container)`
  box-shadow: 0 1px 3px 2px rgba(46, 77, 97, 0.1);
  border-radius: 16px;
  width: 20%;
`;

class ApplyToHost extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    intl: PropTypes.object.isRequired,
    hosts: PropTypes.array.isRequired,
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      becomeHost: {
        id: 'home.fiscalHost.becomeHostBtn',
        defaultMessage: 'Become a fiscal host',
      },
      interestedInHosting: {
        id: 'fiscalHost.interestedInHosting',
        defaultMessage: 'Are you interested in fiscally hosting Collectives?',
      },
      header: {
        id: 'acceptContributions.picker.header',
        defaultMessage: 'Accept financial contributions',
      },
      applyToHost: {
        id: 'pricing.applyFiscalHost',
        defaultMessage: 'Apply to a fiscal host',
      },
      infoParagraph: {
        id: 'fiscalHost.apply.info',
        defaultMessage:
          "With this option, you don't need to set up a legal entity and bank account for your project. The fiscal host will hold funds on your behalf, and take care of accounting, invoices, tax, admin, payments, and liability. Most hosts charge a fee for this service (you can review these details on the host's page before confirming).",
      },
    });
  }

  render() {
    const { hosts, intl, onChange } = this.props;

    return (
      <Fragment>
        <Box mb={4} mt={5}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            {intl.formatMessage(this.messages.header)}
          </H1>
        </Box>
        <Container alignItems="flex-end" display="flex" ml={7} pl={6} width={1}>
          <img src={umbrellaIllustration} width="264px" height="184px" />
          <Box maxWidth={'480px'}>
            <H2 fontSize="H5" color="black.900">
              {intl.formatMessage(this.messages.applyToHost)}
            </H2>
            <P mb={3} lineHeight="LeadParagraph" color="black.700">
              {intl.formatMessage(this.messages.infoParagraph)}
            </P>
          </Box>
        </Container>
        <Container alignItems="flex-start" display="flex" px={6} py={[20, 60]} width={1}>
          <AllCardsContainer>
            {hosts.map(host => (
              <CollectiveCardContainer key={`${host.legacyId}-container`}>
                <HostCollectiveCard
                  key={host.legacyId}
                  host={host}
                  collective={this.props.collective}
                  onChange={onChange}
                />
              </CollectiveCardContainer>
            ))}
          </AllCardsContainer>
          <InterestedContainer
            display="flex"
            flexDirection="column"
            alignItems="center"
            minHeight="750px"
            maxWidth="264px"
            px={[2]}
            pt={6}
            mt={5}
          >
            <H3 fontSize="H5" fontWeight="500" color="black.600" textAlign="center">
              {intl.formatMessage(this.messages.interestedInHosting)}
            </H3>
            <img src={climateIllustration} width="192px" height="192px" />
            <ExternalLink href={FISCAL_HOST_LINK} openInNewTab>
              <StyledButton buttonStyle="dark" mt={[2, 3]} mb={3} px={3}>
                {intl.formatMessage(this.messages.becomeHost)}
              </StyledButton>
            </ExternalLink>
          </InterestedContainer>
        </Container>
      </Fragment>
    );
  }
}

export default injectIntl(ApplyToHost);
