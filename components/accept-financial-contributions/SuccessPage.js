import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
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

import successIllustration from '../../public/static/images/create-collective/acceptContributionsSuccessIllustration.png';

const TIERS_INFO_LINK = 'https://docs.opencollective.com/help/collectives/tiers-goals';

const SmallExternalLink = styled(StyledLink)`
  font-size: 13px;
`;

SmallExternalLink.defaultProps = {
  openInNewTab: true,
};

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
    const { path } = router.query;

    return (
      <Fragment>
        <Flex justifyContent={'center'} alignItems={'center'}>
          <Box mb={4} mt={5} mx={[2, 6]} maxWidth={'575px'}>
            <H1
              fontSize={['20px', '32px']}
              lineHeight={['24px', '36px']}
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
                <P fontSize="16px" lineHeight="21px" fontWeight="bold" mb={4}>
                  {chosenHost.name}
                </P>
                <P fontSize="16px" lineHeight="24px" color="black.600" textAlign="center">
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
              <P fontSize="16px" lineHeight="24px" color="black.600" textAlign="center">
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
            <img src={successIllustration} width="264px" height="352px" />
            <Flex flexDirection="column" ml={[0, 4, 4]} mx={[2, 0]} mt={[4, 0]} maxWidth={'475px'}>
              <H2 fontSize="13px" fontWeight="bold" color="black.800">
                <FormattedMessage id="tiers.about" defaultMessage="About contribution tiers" />
              </H2>
              <P fontSize="13px" lineHeight="20px" mb={3} color="black.800">
                <FormattedMessage
                  id="acceptContributions.tiers.paragraphOne"
                  defaultMessage="We created a one-time donation tier for you to begin with. Go ahead and create different one-time and subscription tiers to define the levels or types of financial contributions your collective accepts. {knowMore}."
                  values={{
                    knowMore: (
                      <SmallExternalLink href={TIERS_INFO_LINK}>
                        <FormattedMessage id="tiers.knowMore" defaultMessage="Know more about tiers" />
                      </SmallExternalLink>
                    ),
                  }}
                />
              </P>
              {path === 'organization' && (
                <Fragment>
                  <H2 fontSize="13px" fontWeight="bold" color="black.800">
                    <FormattedMessage
                      id="acceptContributions.success.hostSettings"
                      defaultMessage="Fiscal Host Settings"
                    />
                  </H2>
                  <P fontSize="13px" lineHeight="20px" mb={1} color="black.800">
                    <FormattedMessage
                      id="acceptContributions.success.hostSettingsInfo"
                      defaultMessage="You can manage your Fiscal Host settings — like adding more payment methods — from your Fiscal Host Organization's profile. {takeMeThere}."
                      values={{
                        takeMeThere: (
                          <Link
                            route="editCollective"
                            params={{
                              slug: collective.host.slug,
                              section: 'fiscal-hosting',
                            }}
                            data-cy="afc-success-host-settings-link"
                          >
                            <FormattedMessage id="takeMeThere" defaultMessage="Take me there" />
                          </Link>
                        ),
                      }}
                    />
                  </P>
                </Fragment>
              )}
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
              data-cy="afc-success-host-tiers-link"
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
