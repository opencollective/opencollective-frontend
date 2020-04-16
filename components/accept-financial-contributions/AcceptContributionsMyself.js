import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { defineMessages, injectIntl } from 'react-intl';
import { Formik, Field, Form } from 'formik';
import { graphql } from '@apollo/react-hoc';

import { H1, H2, P } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import CollectiveNavbar from '../CollectiveNavbar';
import Avatar from '../Avatar';
import StyledTextarea from '../StyledTextarea';
import StyledInputField from '../StyledInputField';
import FinancialContributionsFAQ from '../faqs/FinancialContributionsFAQ';
import MessageBox from '../MessageBox';
import StripeOrBankAccountPicker from './StripeOrBankAccountPicker';

import { withRouter } from 'next/router';
import { Router } from '../../server/pages';
import { withUser } from '../UserProvider';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { getLoggedInUserQuery } from '../../lib/graphql/queries';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { connectAccount } from '../../lib/api';

class AcceptContributionsMyself extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    intl: PropTypes.object.isRequired,
    router: PropTypes.object,
    LoggedInUser: PropTypes.object.isRequired,
    addBankAccount: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: null,
    };

    this.messages = defineMessages({
      header: {
        id: 'acceptContributions.picker.header',
        defaultMessage: 'Accept financial contributions',
      },
      howDoesItWork: {
        id: 'paymentMethods.manual.HowDoesItWork',
        defaultMessage: 'How does it work?',
      },
      howDoesItWorkDetails: {
        id: 'acceptContributions.HowDoesItWork.details',
        defaultMessage:
          'Financial contributors will be able to choose "Bank transfer" as a payment method. Instructions to make the transfer, which you define, will be emailed to them, along with a unique order ID. Once you receive the money, you can mark the corresponding pending order as paid and the funds will be credited to the Collective\'s balance.',
      },
      definePaymentInstructions: {
        id: 'acceptContributions.definePaymentInstructions',
        defaultMessage: 'Define payment instructions',
      },
      definePaymentInstructionsDetails: {
        id: 'acceptContributions.definePaymentInstructionsDetails',
        defaultMessage:
          'Include any details contributors will need to send you money, such as: account name and number; IBAN, Swift, or routing codes; bank name and address, etc. The amount and order ID will be automatically included.',
      },
      cancel: {
        id: 'actions.cancel',
        defaultMessage: 'Cancel',
      },
      save: {
        id: 'save',
        defaultMessage: 'Save',
      },
      addBankAccount: {
        id: 'acceptContributions.addBankAccount',
        defaultMessage: 'Add bank account',
      },
      howAreYouAcceptingContributions: {
        id: 'acceptContributions.howAreYouAcceptingContributions',
        defaultMessage: 'How are you accepting contributions?',
      },
    });
  }

  connectStripe = () => {
    const { collective } = this.props;
    const service = 'stripe';

    connectAccount(collective.id, service)
      .then(json => {
        return (window.location.href = json.redirectUrl);
      })
      .catch(err => {
        console.error(`>>> /api/connected-accounts/${service} error`, err);
      });
  };

  submitBankAccountInformation = async bankAccountInfo => {
    // set state to loading
    this.setState({ loading: true });

    // prepare objects
    const account = {
      legacyId: this.props.LoggedInUser.CollectiveId,
    };

    const value = {
      name: 'Bank ACCOUNT',
      features: {
        recurring: false,
      },
      instructions: `Please make a bank transfer as follows: <br/>\n<br/>\n 
      <code>
      Amount: {amount}
      <br/>\n
      Reference: {orderId}
      <br/>\n
      ${bankAccountInfo}
      </code>`,
    };

    // try mutation
    try {
      await this.props.addBankAccount({
        account,
        key: 'paymentMethods',
        value,
      });
      this.setState({ loading: false });
      Router.pushRoute('accept-financial-contributions', {
        slug: this.props.collective.slug,
        path: this.props.router.query.path,
        state: 'success',
      }).then(() => window.scrollTo(0, 0));
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ error: errorMsg });
    }
  };

  render() {
    const { intl, collective, router, LoggedInUser } = this.props;
    const { error } = this.state;

    const initialValues = {
      bankInformation: '',
    };

    const submit = values => {
      const { bankInformation } = values;
      this.submitBankAccountInformation(bankInformation);
    };

    return (
      <Fragment>
        <CollectiveNavbar collective={collective} onlyInfos={true} />
        <Box mb={2} mt={5} mx={[2, 6]}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            {intl.formatMessage(this.messages.header)}
          </H1>
        </Box>
        <Container display="flex" flexDirection="column" alignItems="center">
          <Flex flexDirection="column" alignItems="center" maxWidth={'575px'} my={2} mx={[3, 0]}>
            <Avatar collective={LoggedInUser.collective} radius={64} mb={2} />
            <P fontSize="LeadParagraph" lineHeight="LeadCaption" fontWeight="bold" mb={3}>
              {LoggedInUser.collective.name}
            </P>
            <H2 fontSize="H5" fontWeight="bold" color="black.900" textAlign="center">
              {router.query.method === 'bank'
                ? intl.formatMessage(this.messages.addBankAccount)
                : intl.formatMessage(this.messages.howAreYouAcceptingContributions)}
            </H2>
          </Flex>
          {router.query.method === 'bank' && (
            <Flex flexWrap={['wrap', 'nowrap']} ml={[0, 2, 4]} mr={[0, 2, 6]} my={2}>
              <Box width={'40%'} display={['none', null, 'block']}></Box>
              <Flex width="auto" flexDirection="column" justifyContent="center" alignItems="center" px={4}>
                <Box alignItems="center">
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontWeight="bold" fontSize={['Paragraph']}>
                    {intl.formatMessage(this.messages.howDoesItWork)}
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontSize={['Paragraph']}>
                    {intl.formatMessage(this.messages.howDoesItWorkDetails)}
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontWeight="bold" fontSize={['Paragraph']}>
                    {intl.formatMessage(this.messages.definePaymentInstructions)}
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontSize={['Paragraph']}>
                    {intl.formatMessage(this.messages.definePaymentInstructionsDetails)}
                  </P>
                  <Formik initialValues={initialValues} onSubmit={submit}>
                    {formik => {
                      const { values, handleSubmit } = formik;

                      return (
                        <Form>
                          <Box width={['100%', '75%']}>
                            <StyledInputField
                              name="bankInformation"
                              htmlFor="bankInformation"
                              label="Bank information (account number, name, bank name, etc.)"
                              value={values.bankInformation}
                              required
                              mt={4}
                              mb={3}
                            >
                              {inputProps => (
                                <Field
                                  as={StyledTextarea}
                                  {...inputProps}
                                  placeholder="Name: Kate Account number: 00000000 Sort: 333333"
                                />
                              )}
                            </StyledInputField>
                          </Box>

                          {error && (
                            <Flex alignItems="center" justifyContent="center">
                              <MessageBox type="error" withIcon mb={[1, 3]}>
                                {error.replace('GraphQL error: ', 'Error: ')}
                              </MessageBox>
                            </Flex>
                          )}

                          <Flex justifyContent={'center'} mb={4}>
                            <StyledButton
                              fontSize="13px"
                              minWidth={'85px'}
                              minHeight="36px"
                              type="button"
                              onClick={() => {
                                Router.pushRoute('accept-financial-contributions', {
                                  slug: this.props.collective.slug,
                                  path: this.props.router.query.path,
                                }).then(() => window.scrollTo(0, 0));
                              }}
                            >
                              {intl.formatMessage(this.messages.cancel)}
                            </StyledButton>
                            <StyledButton
                              fontSize="13px"
                              minWidth={'85px'}
                              minHeight="36px"
                              ml={2}
                              buttonStyle="dark"
                              type="submit"
                              loading={this.state.loading}
                              onSubmit={handleSubmit}
                            >
                              {intl.formatMessage(this.messages.save)}
                            </StyledButton>
                          </Flex>
                        </Form>
                      );
                    }}
                  </Formik>
                </Box>
              </Flex>
              <Flex justifyContent="center" width={['100%', null, '60%', '50%']} my={[3, 0]}>
                <FinancialContributionsFAQ width={['90%', '100%']} />
              </Flex>
            </Flex>
          )}
          {!router.query.method && <StripeOrBankAccountPicker />}
        </Container>
      </Fragment>
    );
  }
}

const bankAccountMutation = gqlV2`
  mutation addBankAccount($account: AccountReferenceInput!, $key: AccountSettingsKey!) {
    editAccountSetting(account: $account, key: $key, value: true) {
      id
      settings
    }
  }
`;

const addBankAccountMutation = graphql(bankAccountMutation, {
  options: {
    context: API_V2_CONTEXT,
  },
  props: ({ mutate }) => ({
    addBankAccount: async ({ account, key, value }) => {
      return await mutate({
        variables: { account, key, value },
        awaitRefetchQueries: true,
        refetchQueries: [{ query: getLoggedInUserQuery }],
      });
    },
  }),
});

export default withUser(withRouter(injectIntl(addBankAccountMutation(AcceptContributionsMyself))));
