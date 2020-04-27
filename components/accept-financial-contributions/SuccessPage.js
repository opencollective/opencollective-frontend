import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { H1, H2, P } from '../Text';

import nonHostSuccessIllustration from '../../public/static/images/create-collective/original/acceptContributionsNonHostSuccessIllustration.png';
import placeholderIllustration from '../../public/static/images/create-collective/original/placeholderGraphic.png';

const TIERS_INFO_LINK = 'https://docs.opencollective.com/help/collectives/tiers-goals';

const SmallExternalLink = styled(StyledLink)`
  font-size: ${themeGet('fontSizes.LeadCaption')}px;
`;

class SuccessPage extends React.Component {
  static propTypes = {
    chosenHost: PropTypes.object,
    collective: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
  };

  componentDidMount() {
    confettiFireworks(5000, { zIndex: 3000 });
  }

  render() {
    const { collective, chosenHost, router } = this.props;
    const { path } = router;

    return (
      <Fragment>
        <Flex justifyContent={'center'} alignItems={'center'}>
          <Box mb={4} mt={5} mx={[2, 6]} maxWidth={'575px'}>
            <H1
              fontSize={['H5', 'H3']}
              lineHeight={['H5', 'H3']}
              fontWeight="bold"
              color="black.900"
              textAlign="center"
            >
              {path === 'host' ? (
                <FormattedMessage
                  id="acceptContributions.myselfSuccess"
                  defaultMessage="You have applied to be hosted by {hostName}."
                  values={{
                    hostName: chosenHost.name,
                  }}
                />
              ) : (
                <FormattedMessage
                  id="acceptContributions.success.nowAcceptingContributions"
                  defaultMessage="Congratulations! {collective} is now accepting financial contributions."
                  values={{
                    collective: collective.name,
                  }}
                />
              )}
            </H1>
          </Box>
        </Flex>
        <Container display="flex" flexDirection="column" alignItems="center">
          <Flex flexDirection="column" alignItems="center" maxWidth={'575px'} my={3} mx={[3, 0]}>
            {path === 'host' ? (
              <Fragment>
                <Avatar collective={chosenHost} radius={64} mb={2} />
                <P fontSize="LeadParagraph" lineHeight="LeadCaption" fontWeight="bold" mb={4}>
                  {chosenHost.name}
                </P>
                <P fontSize="LeadParagraph" lineHeight={'H5'} color="black.600" textAlign="center">
                  <FormattedMessage
                    id="acceptContributions.notifiedWhen"
                    defaultMessage="You will be notified when {hostName} has approved or rejected your application. Contribution tiers will only go live once the Collective is approved by the fiscal host."
                    values={{
                      hostName: chosenHost.name,
                    }}
                  />
                </P>
              </Fragment>
            ) : (
              <P fontSize="LeadParagraph" lineHeight={'H5'} color="black.600" textAlign="center">
                <FormattedMessage
                  id="acceptContributions.success.toConsider"
                  defaultMessage="A few more things you should consider:"
                />
              </P>
            )}
          </Flex>
          <Flex
            flexDirection={['column', 'row']}
            justifyContent="center"
            alignItems="center"
            mx={[2, 4, 0]}
            my={[2, 4]}
          >
            <img
              src={path === 'host' ? placeholderIllustration : nonHostSuccessIllustration}
              width="264px"
              height="352px"
            />
            <Flex flexDirection="column" ml={[0, 4, 4]} mx={[2, 0]} mt={[4, 0]} maxWidth={'475px'}>
              <H2 fontSize="LeadCaption" fontWeight="bold" color="black.800">
                <FormattedMessage id="tiers.about" defaultMessage="About contribution tiers" />
              </H2>
              <P fontSize="LeadCaption" lineHeight="Paragraph" mb={3} color="black.800">
                <FormattedMessage
                  id="acceptContributions.tiers.paragraphOne"
                  defaultMessage="We created a one-time donation tier for you to begin with. Go ahead and create different one-time and subscription tiers to define the levels or types of financial contributions your collective accepts."
                />
              </P>
              <P fontSize="LeadCaption" lineHeight="Paragraph" mb={1} color="black.800">
                <FormattedMessage
                  id="acceptContributions.tiers.paragraphTwo"
                  defaultMessage="You can provide perks or rewards for your tiers, have a set membership fee, or create categories for your contributors. Tiers can be limited to an amount or frequency (one time, monthly, yearly), or can be allowed to be flexibly set by contributors."
                />
              </P>
              <SmallExternalLink href={TIERS_INFO_LINK} openInNewTab>
                <FormattedMessage id="tiers.knowMore" defaultMessage="Know more about tiers" />
              </SmallExternalLink>
            </Flex>
          </Flex>
          <Flex flexDirection={['column', 'row']} justifyContent="center" alignItems="center" my={3}>
            <Link
              route="collective"
              params={{
                slug: collective.slug,
              }}
            >
              <StyledButton buttonStyle="standard" mt={[2, 3]} mb={[3, 2]} px={3}>
                <FormattedMessage
                  id="updatePaymentMethod.form.updatePaymentMethodSuccess.btn"
                  defaultMessage="Go to Collective page"
                />
              </StyledButton>
            </Link>
            <Link
              route="editCollective"
              params={{
                slug: collective.slug,
                section: 'tiers',
              }}
            >
              <StyledButton buttonStyle="dark" mt={[2, 3]} mb={[3, 2]} ml={[null, 3]} px={3}>
                <FormattedMessage id="createCustomTiers" defaultMessage="Create custom tiers" />
              </StyledButton>
            </Link>
          </Flex>
        </Container>
      </Fragment>
    );
  }
}

export default withRouter(SuccessPage);
