import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import Avatar from '../Avatar';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { H1, H2, P } from '../Text';

const TIERS_INFO_LINK = 'https://docs.opencollective.com/help/collectives/tiers-goals';

class SuccessPage extends React.Component {
  static propTypes = {
    chosenHost: PropTypes.object,
    collective: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
  };

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
                  defaultMessage="{collective} is now accepting financial contributions!"
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
                    defaultMessage="You will be notified when {hostName} has approved or rejected your application. Contribution tiers will go live once you have an active Fiscal Host."
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
                  defaultMessage="A few things to consider:"
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
            <Image
              alt=""
              src="/static/images/create-collective/acceptContributionsSuccessIllustration.png"
              width={264}
              height={352}
            />
            <Flex flexDirection="column" ml={[0, 4, 4]} mx={[2, 0]} mt={[4, 0]} maxWidth={'475px'}>
              <H2 fontSize="13px" fontWeight="bold" color="black.800">
                <FormattedMessage id="tiers.about" defaultMessage="Set up contribution tiers" />
              </H2>
              <P fontSize="13px" lineHeight="20px" mb={3} color="black.800">
                <FormattedMessage
                  id="acceptContributions.tiers.paragraphOne"
                  defaultMessage="Customize your contribution tiers with different names, amounts, frequencies (one-time, monthly, or yearly), goals, and rewards. {knowMore}."
                  values={{
                    knowMore: (
                      <StyledLink href={TIERS_INFO_LINK} fontSize="13px" openInNewTab>
                        <FormattedMessage id="tiers.knowMore" defaultMessage="Learn about tiers" />
                      </StyledLink>
                    ),
                  }}
                />
              </P>
              {path === 'organization' && collective.slug !== collective.host.slug && (
                <Fragment>
                  <H2 fontSize="13px" fontWeight="bold" color="black.800">
                    <FormattedMessage id="AdminPanel.FiscalHostSettings" defaultMessage="Fiscal Host Settings" />
                  </H2>
                  <P fontSize="13px" lineHeight="20px" mb={1} color="black.800">
                    <FormattedMessage
                      id="acceptContributions.success.hostSettingsInfo"
                      defaultMessage="Add or manage payment methods in your Fiscal Host settings. {takeMeThere}."
                      values={{
                        takeMeThere: (
                          <Link
                            href={`/dashboard/${collective.host.slug}/fiscal-hosting`}
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
            <Link href={`/${collective.slug}`}>
              <StyledButton buttonStyle="standard" mt={[2, 3]} mb={[3, 2]} px={3}>
                <FormattedMessage
                  id="updatePaymentMethod.form.updatePaymentMethodSuccess.btn"
                  defaultMessage="Go to profile page"
                />
              </StyledButton>
            </Link>
            <Link href={`/dashboard/${collective.slug}/tiers`} data-cy="afc-success-host-tiers-link">
              <StyledButton buttonStyle="dark" mt={[2, 3]} mb={[3, 2]} ml={[null, 3]} px={3}>
                <FormattedMessage id="createCustomTiers" defaultMessage="Create your own tiers" />
              </StyledButton>
            </Link>
          </Flex>
        </Container>
      </Fragment>
    );
  }
}

export default withRouter(SuccessPage);
