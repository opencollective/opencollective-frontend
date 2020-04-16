import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import stripeIllustration from '../../public/static/images/create-collective/stripeIllustration.png';
import bankAccountIllustration from '../../public/static/images/create-collective/bankAccountIllustration.png';
import { P } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import Link from '../Link';

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

class StripeOrBankAccountPicker extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: null,
    };

    this.messages = defineMessages({
      connectStripe: {
        id: 'collective.connectedAccounts.stripe.button',
        defaultMessage: 'Connect Stripe',
      },
      transactionFee: {
        id: 'acceptContributions.transactionFee',
        defaultMessage: '5% transaction fee applies',
      },
      addBankAccount: {
        id: 'acceptContributions.addBankAccount',
        defaultMessage: 'Add bank account',
      },
      bankAccountUpgradeInfo: {
        id: 'acceptContributions.bankAccountUpgradeInfo',
        defaultMessage: "Your first $1000 is free, then you'll need to upgrade to a paid plan",
      },
    });
  }

  render() {
    const { intl, router } = this.props;

    return (
      <Flex flexDirection="column" justifyContent="center" alignItems="center" my={[5]}>
        <Box alignItems="center">
          <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
            <Container alignItems="center" width={[null, 280, 312]} mb={[2, 0]}>
              <Flex flexDirection="column" justifyContent="center" alignItems="center">
                <Image src={stripeIllustration} alt={intl.formatMessage(this.messages.connectStripe)} />
                <StyledButton
                  fontSize="13px"
                  buttonStyle="dark"
                  minHeight="36px"
                  mt={[2, 3]}
                  mb={3}
                  minWidth={'145px'}
                  onClick={() => this.connectStripe()}
                >
                  {intl.formatMessage(this.messages.connectStripe)}
                </StyledButton>
                <Box minHeight={50} px={3}>
                  <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                    {intl.formatMessage(this.messages.transactionFee)}
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
                <Link
                  route="accept-financial-contributions"
                  params={{
                    slug: router.query.slug,
                    path: 'myself',
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
                    {intl.formatMessage(this.messages.addBankAccount)}
                  </StyledButton>
                </Link>
                <Box minHeight={50} px={3}>
                  <P color="black.600" textAlign="center" mt={[2, 3]} fontSize={['Caption', 'Paragraph']}>
                    {intl.formatMessage(this.messages.bankAccountUpgradeInfo)}
                  </P>
                </Box>
              </Flex>
            </Container>
          </Flex>
        </Box>
      </Flex>
    );
  }
}

export default withRouter(injectIntl(StripeOrBankAccountPicker));
