import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '../Grid';
import { FormattedMessage } from 'react-intl';
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
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

class AcceptContributionsMyself extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    router: PropTypes.object,
    LoggedInUser: PropTypes.object.isRequired,
    addBankAccount: PropTypes.func,
    refetchLoggedInUser: PropTypes.func,
    applyToHost: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: null,
    };
  }

  addHost = async (collective, host) => {
    const collectiveInput = {
      legacyId: collective.id,
    };
    const hostInput = {
      legacyId: host.id,
    };
    try {
      await this.props.applyToHost({
        variables: {
          collective: collectiveInput,
          host: hostInput,
        },
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      throw new Error(errorMsg);
    }
  };

  submitBankAccountInformation = async bankAccountInfo => {
    // prepare objects
    const account = {
      legacyId: this.props.LoggedInUser.CollectiveId,
    };

    const value = {
      manual: {
        title: 'Bank transfer',
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
      },
    };

    // try mutation
    try {
      await this.props.addBankAccount({
        variables: {
          account,
          key: 'paymentMethods',
          value,
        },
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      throw new Error(errorMsg);
    }
  };

  render() {
    const { collective, router, LoggedInUser } = this.props;
    const { error } = this.state;

    const initialValues = {
      bankInformation: '',
    };

    const submit = async values => {
      try {
        this.setState({ loading: true });
        const { bankInformation } = values;
        await this.submitBankAccountInformation(bankInformation);
        await this.addHost(collective, LoggedInUser.collective);
        await this.props.refetchLoggedInUser();
        await Router.pushRoute('accept-financial-contributions', {
          slug: this.props.collective.slug,
          path: this.props.router.query.path,
          state: 'success',
        });
        window.scrollTo(0, 0);
      } catch (e) {
        this.setState({ loading: false });
        this.setState({ error: e });
      }
    };

    return (
      <Fragment>
        <CollectiveNavbar collective={collective} onlyInfos={true} />
        <Box mb={2} mt={5} mx={[2, 6]}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            <FormattedMessage id="acceptContributions.picker.header" defaultMessage="Accept financial contributions" />
          </H1>
        </Box>
        <Container display="flex" flexDirection="column" alignItems="center">
          <Flex flexDirection="column" alignItems="center" maxWidth={'575px'} my={2} mx={[3, 0]}>
            <Avatar collective={LoggedInUser.collective} radius={64} mb={2} />
            <P fontSize="LeadParagraph" lineHeight="LeadCaption" fontWeight="bold" mb={3}>
              {LoggedInUser.collective.name}
            </P>
            <H2 fontSize="H5" fontWeight="bold" color="black.900" textAlign="center">
              {router.query.method === 'bank' ? (
                <FormattedMessage id="acceptContributions.addBankAccount" defaultMessage="Add bank account" />
              ) : (
                <FormattedMessage
                  id="acceptContributions.howAreYouAcceptingContributions"
                  defaultMessage="How are you accepting contributions?"
                />
              )}
            </H2>
          </Flex>
          {router.query.method === 'bank' && (
            <Flex flexDirection={['column', 'row']} justifyContent={'space-evenly'} mx={[2, 4]} my={3}>
              <Box width={1 / 5} display={['none', null, 'block']}></Box>
              <Flex width={[1, 1 / 2]} flexDirection="column" justifyContent="center" alignItems="center" px={3}>
                <Box alignItems="center">
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontWeight="bold" fontSize={['Paragraph']}>
                    <FormattedMessage id="paymentMethods.manual.HowDoesItWork" defaultMessage="How does it work?" />
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontSize={['Paragraph']}>
                    <FormattedMessage
                      id="acceptContributions.HowDoesItWork.details"
                      defaultMessage="Financial contributors will be able to choose 'Bank transfer' as a payment method. Instructions to make the transfer, which you define, will be emailed to them, along with a unique order ID. Once you receive the money, you can mark the corresponding pending order as paid and the funds will be credited to the Collective\'s balance."
                    />
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontWeight="bold" fontSize={['Paragraph']}>
                    <FormattedMessage
                      id="acceptContributions.definePaymentInstructions"
                      defaultMessage="Define payment instructions"
                    />
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontSize={['Paragraph']}>
                    <FormattedMessage
                      id="acceptContributions.definePaymentInstructionsDetails"
                      defaultMessage="Include any details contributors will need to send you money, such as: account name and number; IBAN, Swift, or routing codes; bank name and address, etc. The amount and order ID will be automatically included."
                    />
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
                                {error.message}
                              </MessageBox>
                            </Flex>
                          )}

                          <Flex justifyContent={'center'} my={4}>
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
                              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
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
                              <FormattedMessage id="save" defaultMessage="Save" />
                            </StyledButton>
                          </Flex>
                        </Form>
                      );
                    }}
                  </Formik>
                </Box>
              </Flex>
              <Flex justifyContent="center" width={[1, 1 / 3, 1 / 5]} my={[3, 0]}>
                <FinancialContributionsFAQ width={['90%', '100%']} />
              </Flex>
            </Flex>
          )}
          {!router.query.method && (
            <StripeOrBankAccountPicker collective={collective} host={LoggedInUser.collective} addHost={this.addHost} />
          )}
        </Container>
      </Fragment>
    );
  }
}

const bankAccountMutation = gqlV2`
  mutation addBankAccount($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const applyToHostMutation = gqlV2`
mutation applyToHost($collective: AccountReferenceInput!, $host: AccountReferenceInput!) {
  applyToHost(collective: $collective, host: $host) {
    id
    slug
    host {
      id
      slug
    }
  }
}
`;

const addApplyToHostMutation = graphql(applyToHostMutation, {
  name: 'applyToHost',
  options: { context: API_V2_CONTEXT },
});

const addBankAccountMutation = graphql(bankAccountMutation, {
  name: 'addBankAccount',
  options: { context: API_V2_CONTEXT },
});

export default withUser(withRouter(addBankAccountMutation(addApplyToHostMutation(AcceptContributionsMyself))));
