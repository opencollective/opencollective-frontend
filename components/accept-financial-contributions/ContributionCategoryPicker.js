import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import CollectiveNavbar from '../CollectiveNavbar';
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
      myself: {
        id: 'acceptContributions.picker.myself',
        defaultMessage: 'Myself',
      },
      myselfInfo: {
        id: 'acceptContributions.picker.myselfInfo',
        defaultMessage: 'Use my personal bank account',
      },
      host: { id: 'acceptContributions.picker.host', defaultMessage: 'A fiscal host' },
      organization: { id: 'acceptContributions.picker.organization', defaultMessage: 'Our organization' },
      organizationInfo: {
        id: 'acceptContributions.picker.organizationInfo',
        defaultMessage: 'Use my company or organization bank account',
      },
    });
  }

  render() {
    const { intl, router, collective } = this.props;

    return (
      <div>
        <CollectiveNavbar collective={collective} onlyInfos={true} />
        <Box mb={4} mt={5}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            {intl.formatMessage(this.messages.header)}
          </H1>
          <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
            {intl.formatMessage(this.messages.subtitle)}
          </P>
        </Box>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" mb={[5, 6]}>
          <Box alignItems="center">
            <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
              <Container alignItems="center" width={[null, 280, 312]} mb={[2, 0]}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Box size={[192, 208, 256]}>
                    <Image src={acceptMyselfIllustration} alt={intl.formatMessage(this.messages.myself)} />
                    <HoverImage src={acceptMyselfHoverIllustration} alt={intl.formatMessage(this.messages.myself)} />
                  </Box>
                  <Link
                    route="accept-financial-contributions"
                    params={{
                      slug: router.query.slug,
                      path: 'myself',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      minWidth={'145px'}
                      data-cy="afc-picker-myself-button"
                    >
                      {intl.formatMessage(this.messages.myself)}
                    </StyledButton>
                  </Link>
                  <Box minHeight={50} px={3}>
                    <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                      {intl.formatMessage(this.messages.myselfInfo)}
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
                  <Link
                    route="accept-financial-contributions"
                    params={{
                      slug: router.query.slug,
                      path: 'organization',
                    }}
                  >
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
                    <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
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
                  <Link
                    route="accept-financial-contributions"
                    params={{
                      slug: router.query.slug,
                      path: 'host',
                    }}
                  >
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
                    <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                      <FormattedMessage
                        id="acceptContributions.picker.hostInfo"
                        defaultMessage="Outsource fundholding to an entity who offers this service ({moreInfo})"
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
