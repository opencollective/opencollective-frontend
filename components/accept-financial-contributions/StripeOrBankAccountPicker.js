import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '../Grid';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { graphql } from '@apollo/react-hoc';
import { has, find } from 'lodash';
import themeGet from '@styled-system/theme-get';
import { CheckboxChecked } from '@styled-icons/boxicons-regular/CheckboxChecked';

import stripeIllustration from '../../public/static/images/create-collective/stripeIllustration.png';
import bankAccountIllustration from '../../public/static/images/create-collective/bankAccountIllustration.png';
import { P } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import Link from '../Link';
import Loading from '../Loading';
import { getCollectivePageQuery } from '../collective-page/graphql/queries';

import { connectAccount } from '../../lib/api';
import { Router } from '../../server/pages';

import { withRouter } from 'next/router';

const Image = styled.img`
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

const ConnectedAccountCard = styled(Flex)`
  box-shadow: 0 1px 3px 2px rgba(46, 77, 97, 0.1);
  border-radius: 16px;
`;

const GreenCheckbox = styled(CheckboxChecked)`
  color: ${themeGet('colors.green.700')};
`;

class StripeOrBankAccountPicker extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    router: PropTypes.object,
    hostCollectiveSlug: PropTypes.string.isRequired,
    LoggedInUser: PropTypes.object,
    addHost: PropTypes.func.isRequired,
    collective: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: null,
    };

    this.messages = defineMessages({
      addBankAccount: {
        id: 'acceptContributions.addBankAccount',
        defaultMessage: 'Add bank account',
      },
      connectStripe: {
        id: 'collective.connectedAccounts.stripe.button',
        defaultMessage: 'Connect Stripe',
      },
    });
  }

  connectStripe = () => {
    const { collective } = this.props.LoggedInUser ? this.props.LoggedInUser : this.props.data.Collective;
    const service = 'stripe';

    connectAccount(collective.id, service)
      .then(json => {
        return (window.location.href = json.redirectUrl);
      })
      .catch(err => {
        console.error(`>>> /api/connected-accounts/${service} error`, err);
      });
  };

  render() {
    const { router, data, LoggedInUser, addHost, collective, intl } = this.props;
    const { loading, Collective } = data;

    if (loading) {
      return <Loading />;
    }

    const hostOrganization = Collective;

    const isBankAccountAlreadyThere = LoggedInUser
      ? has(LoggedInUser, 'collective.settings.paymentMethods.manual')
      : has(hostOrganization, 'settings.paymentMethods.manual');
    const connectedAccounts = LoggedInUser
      ? LoggedInUser.collective.connectedAccounts
      : hostOrganization.connectedAccounts;
    const stripeAccount = find(connectedAccounts, { service: 'stripe' });

    return (
      <Flex flexDirection="column" justifyContent="center" alignItems="center" my={[5]}>
        <Box alignItems="center">
          <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
            <Container alignItems="center" width={[null, 280, 312]} mb={[2, 0]}>
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                <Image src={stripeIllustration} alt={intl.formatMessage(this.messages.connectStripe)} />
                {stripeAccount ? (
                  <ConnectedAccountCard
                    width={2 / 3}
                    px={2}
                    mt={[2, 3]}
                    mb={3}
                    alignItems="center"
                    justifyContent="space-around"
                  >
                    <GreenCheckbox size={30} />
                    <Flex flexDirection="column" minHeight={'47px'} justifyContent="space-evenly">
                      <P fontWeight="bold">
                        <FormattedMessage id="acceptContributions.stripeConnected" defaultMessage="Stripe connected" />
                      </P>
                      <P fontSize="Caption" color="black.500" textTransform="uppercase">
                        <FormattedMessage id="acceptContributions.personalAccount" defaultMessage="Personal account" />
                      </P>
                    </Flex>
                  </ConnectedAccountCard>
                ) : (
                  <StyledButton
                    fontSize="13px"
                    buttonStyle="dark"
                    minHeight="36px"
                    mt={[2, 3]}
                    mb={3}
                    minWidth={'145px'}
                    onClick={() => {
                      const host = LoggedInUser ? LoggedInUser.collective : hostOrganization;
                      addHost(collective, host);
                      this.connectStripe();
                    }}
                  >
                    <FormattedMessage id="collective.connectedAccounts.stripe.button" defaultMessage="Connect Stripe" />
                  </StyledButton>
                )}
                <Box minHeight={50} px={3}>
                  <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                    <FormattedMessage
                      id="acceptContributions.transactionFee"
                      defaultMessage="5% transaction fee applies"
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
              mb={[2, 0]}
              pt={[3, 0]}
            >
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                <Image src={bankAccountIllustration} alt={intl.formatMessage(this.messages.addBankAccount)} />
                {isBankAccountAlreadyThere ? (
                  <ConnectedAccountCard
                    width={2 / 3}
                    px={2}
                    mt={[2, 3]}
                    mb={3}
                    alignItems="center"
                    justifyContent="space-around"
                  >
                    <GreenCheckbox size={30} />
                    <Flex flexDirection="column" minHeight={'47px'} justifyContent="space-evenly">
                      <P fontWeight="bold">
                        <FormattedMessage
                          id="acceptContributions.bankAccountSetUp"
                          defaultMessage="Bank account set up"
                        />
                      </P>
                      <P fontSize="Caption" color="black.500" textTransform="uppercase">
                        <FormattedMessage id="acceptContributions.personalAccount" defaultMessage="Personal account" />
                      </P>
                    </Flex>
                  </ConnectedAccountCard>
                ) : (
                  <Link
                    route="accept-financial-contributions"
                    params={{
                      slug: router.query.slug,
                      path: router.query.path,
                      method: 'bank',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="dark"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      minWidth={'145px'}
                    >
                      <FormattedMessage id="acceptContributions.addBankAccount" defaultMessage="Add bank account" />
                    </StyledButton>
                  </Link>
                )}
                <Box minHeight={50} px={3}>
                  <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                    <FormattedMessage
                      id="acceptContributions.bankAccountUpgradeInfo"
                      defaultMessage="Your first $1000 is free, then you'll need to upgrade to a paid plan"
                    />
                  </P>
                </Box>
              </Flex>
            </Container>
          </Flex>
        </Box>
        {(isBankAccountAlreadyThere || stripeAccount) && (
          <StyledButton
            fontSize="13px"
            minHeight="36px"
            mt={4}
            minWidth={'145px'}
            onClick={async () => {
              const host = LoggedInUser ? LoggedInUser.collective : hostOrganization;
              await addHost(collective, host);
              await Router.pushRoute('accept-financial-contributions', {
                slug: router.query.slug,
                path: router.query.path,
                state: 'success',
              });
              window.scrollTo(0, 0);
            }}
          >
            <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
          </StyledButton>
        )}
      </Flex>
    );
  }
}

const getBankAccountInfo = graphql(getCollectivePageQuery, {
  options: props => ({
    variables: {
      slug: props.hostCollectiveSlug,
    },
  }),
});

export default injectIntl(withRouter(getBankAccountInfo(StripeOrBankAccountPicker)));
