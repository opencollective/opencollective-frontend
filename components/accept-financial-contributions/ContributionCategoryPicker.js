import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import CollectiveNavbar from '../collective-navbar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Image from '../Image';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H1, P } from '../Text';

const ImageSizingContainer = styled(Container)`
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

const HoverImageSizingContainer = styled(ImageSizingContainer)`
  opacity: 0;
  &:hover {
    opacity: 1;
  }
`;

const independentCollectiveMoreInfo = 'https://docs.opencollective.com/help/independent-collectives';
const applyFiscalHostMoreInfo = 'https://opencollective.com/fiscal-hosting';

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
        defaultMessage: 'Who will hold money on behalf of this Collective?',
      },
      ourselves: {
        id: 'acceptContributions.picker.ourselves',
        defaultMessage: 'Independent Collective',
      },
      host: { id: 'acceptContributions.picker.host', defaultMessage: 'Join a Fiscal Host' },
    });
  }

  render() {
    const { intl, router, collective } = this.props;

    return (
      <div>
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
                    <ImageSizingContainer>
                      <Image
                        width={256}
                        height={256}
                        src="/static/images/create-collective/acceptContributionsMyselfIllustration.png"
                        alt={intl.formatMessage(this.messages.ourselves)}
                      />
                    </ImageSizingContainer>
                    <HoverImageSizingContainer>
                      <Image
                        width={256}
                        height={256}
                        src="/static/images/create-collective/acceptContributionsMyselfHoverIllustration.png"
                        alt={intl.formatMessage(this.messages.ourselves)}
                      />
                    </HoverImageSizingContainer>
                  </Box>
                  <Link href={`/${router.query.slug}/accept-financial-contributions/ourselves`}>
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="primary"
                      minHeight="36px"
                      mt={[2, 4]}
                      mb={3}
                      minWidth={'145px'}
                      data-cy="afc-picker-myself-button"
                    >
                      {intl.formatMessage(this.messages.ourselves)}
                    </StyledButton>
                  </Link>
                  <Box minHeight={50} px={3}>
                    <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['12px', '14px']}>
                      <FormattedMessage
                        id="acceptContributions.picker.ourselvesInfo"
                        defaultMessage="Simply connect a bank account to your Collective. You will be responsible for accounting, taxes, payments, and liability. Choose this option if you have a single Collective and want to hold funds for it yourself. <MoreInfoLink>More info</MoreInfoLink>"
                        values={{
                          MoreInfoLink: getI18nLink({
                            href: independentCollectiveMoreInfo,
                            openInNewTab: true,
                          }),
                        }}
                      />
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
                    <ImageSizingContainer>
                      <Image
                        width={256}
                        height={256}
                        src="/static/images/create-collective/acceptContributionsHostIllustration.png"
                        alt={intl.formatMessage(this.messages.host)}
                      />
                    </ImageSizingContainer>
                    <HoverImageSizingContainer>
                      <Image
                        width={256}
                        height={256}
                        src="/static/images/create-collective/acceptContributionsHostHoverIllustration.png"
                        alt={intl.formatMessage(this.messages.host)}
                      />
                    </HoverImageSizingContainer>
                  </Box>
                  <Link href={`/${router.query.slug}/accept-financial-contributions/host`}>
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="primary"
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
                        defaultMessage="Apply to join a Fiscal Host, who will hold money on behalf of your Collective. Choose this option if you want someone else to take care of banking, accounting, taxes, payments, and liability. <MoreInfoLink>More info</MoreInfoLink>"
                        values={{
                          MoreInfoLink: getI18nLink({
                            href: applyFiscalHostMoreInfo,
                            openInNewTab: true,
                          }),
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
