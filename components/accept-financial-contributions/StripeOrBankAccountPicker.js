import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { CheckboxChecked } from '@styled-icons/boxicons-regular/CheckboxChecked';
import themeGet from '@styled-system/theme-get';
import { find, has } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { connectAccount } from '../../lib/api';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import Loading from '../Loading';
import StyledButton from '../StyledButton';
import { P } from '../Text';

import bankAccountIllustration from '../../public/static/images/create-collective/bankAccountIllustration.png';
import stripeIllustration from '../../public/static/images/create-collective/stripeIllustration.png';

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
    collective: PropTypes.object.isRequired,
    host: PropTypes.object.isRequired,
    addHost: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      buttonLoading: false,
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

  connectStripe = async () => {
    const service = 'stripe';
    try {
      const json = await connectAccount(this.props.host.id, service);
      window.location.href = json.redirectUrl;
    } catch (err) {
      console.error(`>>> /api/connected-accounts/${service} error`, err);
    }
  };

  render() {
    const { router, addHost, collective, intl, data } = this.props;
    const { buttonLoading } = this.state;

    const { loading, host } = data;

    if (loading) {
      return <Loading />;
    }

    const isBankAccountAlreadyThere = has(host, 'settings.paymentMethods.manual');
    const stripeAccount = find(host.connectedAccounts, { service: 'stripe' });

    return (
      <Flex flexDirection="column" justifyContent="center" alignItems="center" my={5}>
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
                      addHost(collective, host);
                      this.connectStripe();
                    }}
                  >
                    <FormattedMessage id="collective.connectedAccounts.stripe.button" defaultMessage="Connect Stripe" />
                  </StyledButton>
                )}
                <Box minHeight={50} px={3}>
                  <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['12px', '14px']}>
                    <FormattedMessage
                      id="acceptContributions.stripe.info"
                      defaultMessage="Automatically accept contributions with credit cards from all over the world."
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
                      data-cy="afc-add-bank-button"
                    >
                      <FormattedMessage id="acceptContributions.addBankAccount" defaultMessage="Add bank account" />
                    </StyledButton>
                  </Link>
                )}
                <Box minHeight={50} px={3}>
                  <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['12px', '14px']}>
                    <FormattedMessage
                      id="acceptContributions.bankAccount.info"
                      defaultMessage="Manually sync contributions received on your bank account with your Collective's budget."
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
            loading={buttonLoading}
            onClick={async () => {
              this.setState({ buttonLoading: true });
              await addHost(collective, host);
              await Router.pushRoute('accept-financial-contributions', {
                slug: router.query.slug,
                path: router.query.path,
                state: 'success',
              });
              window.scrollTo(0, 0);
            }}
            data-cy="afc-finish-button"
          >
            <FormattedMessage id="Finish" defaultMessage="Finish" />
            &nbsp;&rarr;
          </StyledButton>
        )}
      </Flex>
    );
  }
}

// We query on "account" and not "host" because the account is not necessarily an host yet
const hostQuery = gqlV2/* GraphQL */ `
  query AcceptFinancialContributionsHost($slug: String!) {
    host: account(slug: $slug) {
      id
      slug
      connectedAccounts {
        id
        service
      }
      settings
    }
  }
`;

const addHostData = graphql(hostQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: {
      slug: props.host.slug,
    },
  }),
});

export default injectIntl(withRouter(addHostData(StripeOrBankAccountPicker)));
