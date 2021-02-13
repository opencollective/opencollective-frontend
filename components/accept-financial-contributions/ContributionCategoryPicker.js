import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import CollectiveNavbar from '../collective-navbar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { H1, P } from '../Text';

import acceptHostHoverIllustration from '../../public/static/images/create-collective/acceptContributionsHostHoverIllustration.png';
import acceptHostIllustration from '../../public/static/images/create-collective/acceptContributionsHostIllustration.png';
import acceptMyselfHoverIllustration from '../../public/static/images/create-collective/acceptContributionsMyselfHoverIllustration.png';
import acceptMyselfIllustration from '../../public/static/images/create-collective/acceptContributionsMyselfIllustration.png';
import acceptOrganizationHoverIllustration from '../../public/static/images/create-collective/acceptContributionsOrganizationHoverIllustration.png';
import acceptOrganizationIllustration from '../../public/static/images/create-collective/acceptContributionsOrganizationIllustration.png';

const Image = styled.img`
  position: absolute;
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

const HoverImage = styled.img`
  position: absolute;
  opacity: 0;
  &:hover {
    opacity: 1;
  }
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

const moreInfoHostsLink = 'https://docs.opencollective.com/help/collectives/add-or-change-fiscal-host';

class ContributionCategoryPicker extends React.Component {
  static propTypes = {
    router: PropTypes.object,
    intl: PropTypes.object.isRequired,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      header: {
        id: 'acceptContributions.picker.header',
        defaultMessage: 'Accept financial contributions',
      },
      subtitle: {
        id: 'acceptContributions.picker.subtitle',
        defaultMessage: 'Who will hold money on behalf of the Collective?',
      },
      ourselves: {
        id: 'acceptContributions.picker.ourselves',
        defaultMessage: 'Ourselves',
      },
      ourselvesInfo: {
        id: 'acceptContributions.picker.ourselvesInfo',
        defaultMessage:
          'Simply connect a bank account to your Collective. You will be responsible for accounting, taxes, payments, and liability. Choose this option if you have a single Collective and want to hold funds for it yourself.',
      },
      host: { id: 'acceptContributions.picker.host', defaultMessage: 'A Fiscal Host' },
      organization: { id: 'acceptContributions.organization.subtitle', defaultMessage: 'Our organization' },
      organizationInfo: {
        id: 'acceptContributions.picker.organizationInfo',
        defaultMessage:
          'Create a Fiscal Host to hold funds for multiple Collectives, or select a one that you already manage. Choose this option if you have a legal entity set up to handle accounting, taxes, payments, and liability for multiple Collectives.',
      },
    });
  }

  render() {
    const { intl, router, collective } = this.props;

    return (
      <div>
        <CollectiveNavbar collective={collective} onlyInfos={true} />
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
          <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['12px', '14px']}>
            {intl.formatMessage(this.messages.subtitle)}
          </P>
        </Box>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" mb={[5, 6]}>
          <Box alignItems="center">
            <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
              <Container alignItems="center" width={[null, 280, 312]} mb={[2, 0]}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Box size={[192, 208, 256]}>
                    <Image src={acceptMyselfIllustration} alt={intl.formatMessage(this.messages.ourselves)} />
                    <HoverImage src={acceptMyselfHoverIllustration} alt={intl.formatMessage(this.messages.ourselves)} />
                  </Box>
                  <Link href={`${router.query.slug}/accept-financial-contributions/ourselves`}>
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      minWidth={'145px'}
                      data-cy="afc-picker-myself-button"
                    >
                      {intl.formatMessage(this.messages.ourselves)}
                    </StyledButton>
                  </Link>
                  <Box minHeight={50} px={3}>
                    <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['12px', '14px']}>
                      {intl.formatMessage(this.messages.ourselvesInfo)}
                    </P>
                  </Box>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB']}
                borderTop={['1px solid #E6E8EB', 'none']}
                alignItems="center"
                width={[null, 280, 312]}
                mb={[2, 0]}
                pt={[3, 0]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Box size={[192, 208, 256]}>
                    <Image src={acceptOrganizationIllustration} alt={intl.formatMessage(this.messages.organization)} />
                    <HoverImage
                      src={acceptOrganizationHoverIllustration}
                      alt={intl.formatMessage(this.messages.organization)}
                    />
                  </Box>
                  <Link href={`${router.query.slug}/accept-financial-contributions/organization`}>
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      minWidth={'145px'}
                      data-cy="afc-picker-organization-button"
                    >
                      {intl.formatMessage(this.messages.organization)}
                    </StyledButton>
                  </Link>
                  <Box minHeight={50} px={3}>
                    <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['12px', '14px']}>
                      {intl.formatMessage(this.messages.organizationInfo)}
                    </P>
                  </Box>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB']}
                borderTop={['1px solid #E6E8EB', 'none']}
                alignItems="center"
                width={[null, 280, 312]}
                pt={[3, 0]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Box size={[192, 208, 256]}>
                    <Image src={acceptHostIllustration} alt={intl.formatMessage(this.messages.host)} />
                    <HoverImage src={acceptHostHoverIllustration} alt={intl.formatMessage(this.messages.host)} />
                  </Box>
                  <Link href={`${router.query.slug}/accept-financial-contributions/host`}>
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      minWidth={'145px'}
                      data-cy="afc-picker-host-button"
                    >
                      {intl.formatMessage(this.messages.host)}
                    </StyledButton>
                  </Link>
                  <Box minHeight={50} px={3}>
                    <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['12px', '14px']}>
                      <FormattedMessage
                        id="acceptContributions.picker.hostInfo"
                        defaultMessage="Apply to join a Fiscal Host, who will hold money on behalf of your Collective. Choose this option if you want someone else to take care of banking, accounting, taxes, payments, and liability. {moreInfo}"
                        values={{
                          moreInfo: (
                            <StyledLink href={moreInfoHostsLink} openInNewTab>
                              More info
                            </StyledLink>
                          ),
                        }}
                      />
                    </P>
                  </Box>
                </Flex>
              </Container>
            </Flex>
          </Box>
        </Flex>
      </div>
    );
  }
}

export default withRouter(injectIntl(ContributionCategoryPicker));
