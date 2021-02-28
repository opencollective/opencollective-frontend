import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import StyledTag from '../../components/StyledTag';

import CollectiveNavbar from '../collective-navbar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { H1, H2, H3, P } from '../Text';

import HostsContainer from './HostsContainer';

import umbrellaIllustration from '../../public/static/images/create-collective/acceptContributionsHostHoverIllustration.png';
import becomeFiscalHostIllustration from '../../public/static/images/create-collective/becomeFiscalHostIllustration.png';

const FISCAL_HOST_LINK = 'https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host';

const FilterTag = styled(StyledTag)`
  font-size: 14px;
  border-top-right-radius: 50px;
  border-bottom-right-radius: 50px;
  text-transform: none;
  display: flex;
  align-items: center;
  width: fit-content;
  cursor: pointer;
`;

const InterestedContainer = styled(Container)`
  box-shadow: 0 1px 3px 2px rgba(46, 77, 97, 0.1);
  border-radius: 16px;
`;

class ApplyToHost extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      tags: null,
    };

    this.messages = defineMessages({
      header: {
        id: 'acceptContributions.picker.header',
        defaultMessage: 'Accept financial contributions',
      },
      applyToHost: {
        id: 'pricing.applyFiscalHost',
        defaultMessage: 'Apply to a Fiscal Host',
      },
      infoParagraph: {
        id: 'fiscalHost.apply.info',
        defaultMessage:
          "With this option, you don't need a legal entity and bank account for your project. The Fiscal Host will hold funds on your behalf, and take care of accounting, invoices, tax, admin, payments, and liability. Most Hosts charge a fee for this service (you'll have a chance to review these details before applying to join a Host).",
      },
      becomeHost: {
        id: 'home.becomeFiscalHost',
        defaultMessage: 'Become a Fiscal Host',
      },
      interestedInHosting: {
        id: 'fiscalHost.interestedInHosting',
        defaultMessage: 'Are you interested in fiscally hosting Collectives?',
      },
      seeMoreHosts: {
        id: 'fiscalHost.seeMoreHosts',
        defaultMessage: 'See more Hosts',
      },
      allFiscalHosts: {
        id: 'fiscalHost.allFiscalHosts',
        defaultMessage: 'All Fiscal Hosts',
      },
    });

    this.tagList = {
      all: props.intl.formatMessage(this.messages.allFiscalHosts),
      opensource: 'Open Source', // No need to translate
      'covid-19': 'COVID-19', // No need to translate
    };
  }

  setTags = tag => {
    tag === 'all' ? this.setState({ tags: null }) : this.setState({ tags: [tag] });
  };

  getTags = tag => {
    // this will need to be updated if we decide to have more than one tag
    return tag === null ? 'all' : tag[0];
  };

  render() {
    const { intl, onChange, collective } = this.props;
    const { tags } = this.state;

    return (
      <Fragment>
        <CollectiveNavbar collective={collective} />
        <Box mb={4} mt={5}>
          <H1
            fontSize={['20px', '32px']}
            lineHeight={['24px', '36px']}
            fontWeight="bold"
            color="black.900"
            textAlign="center"
          >
            {intl.formatMessage(this.messages.header)}
          </H1>
        </Box>
        <Container px={[1, null, 7]} mb={5}>
          <Container
            display="flex"
            alignItems={['center', 'flex-end']}
            flexDirection={['column', null, 'row']}
            width={1}
            px={[3, 5]}
            my={3}
          >
            <img alt="" src={umbrellaIllustration} width="160px" height="160px" />
            <Box maxWidth={'480px'} ml={[0, 4]}>
              <H2 fontSize="20px" color="black.900" textAlign={['center', 'left']} my={[3, 0]}>
                {intl.formatMessage(this.messages.applyToHost)}
              </H2>
              <P mb={2} lineHeight="24px" color="black.700">
                {intl.formatMessage(this.messages.infoParagraph)}
              </P>
            </Box>
          </Container>
          <Flex px={[3, 5]} my={4} flexWrap="wrap">
            {Object.keys(this.tagList).map(tagKey => (
              <FilterTag
                key={`${tagKey}-tag`}
                px={2}
                mr={2}
                type={this.getTags(tags) === tagKey ? 'dark' : 'info'}
                onClick={() => this.setTags(tagKey)}
              >
                {this.tagList[tagKey]}
              </FilterTag>
            ))}
          </Flex>
          <Container
            justifyContent="space-between"
            alignItems={['center', 'flex-start']}
            flexDirection={['column', null, 'row']}
            display="flex"
            width={1}
          >
            <HostsContainer onChange={onChange} collective={collective} tags={tags} />
            <InterestedContainer
              display="flex"
              flexDirection={['column', 'row', 'column']}
              alignItems="center"
              minHeight={[null, null, '750px']}
              maxWidth={['288px', '768px', '264px']}
              minWidth={[null, null, '264px']}
              px={[4, 2]}
              pt={[2, null, 6]}
              pb={[4, 2, 0]}
              mt={[4, 3, 5]}
              mb={[4, 0]}
            >
              <Box order={[2, 1, 1]}>
                <H3
                  fontSize={['16px', '20px']}
                  fontWeight="500"
                  lineHeight={['24px', '24px']}
                  color="black.600"
                  textAlign="center"
                  order={2}
                  py={[2, 0]}
                >
                  {intl.formatMessage(this.messages.interestedInHosting)}
                </H3>
              </Box>
              <Box order={[3, 2, 3]}>
                <StyledLink href={FISCAL_HOST_LINK} openInNewTab>
                  <StyledButton buttonStyle="dark" mt={[2, 3]} mb={3} px={3}>
                    {intl.formatMessage(this.messages.becomeHost)}
                  </StyledButton>
                </StyledLink>
              </Box>
              <Box order={[1, 3, 2]}>
                <img alt="" src={becomeFiscalHostIllustration} width="192px" height="192px" />
              </Box>
            </InterestedContainer>
          </Container>
        </Container>
      </Fragment>
    );
  }
}

export default injectIntl(ApplyToHost);
