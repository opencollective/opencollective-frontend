import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { PlusCircle } from '@styled-icons/boxicons-regular/PlusCircle';
import { Field, Form, Formik } from 'formik';
import { uniqBy } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import Avatar from '../Avatar';
import { getCollectivePageQuery } from '../collective-page/graphql/queries';
import CollectiveNavbar from '../CollectiveNavbar';
import Container from '../Container';
import CreateCollectiveMiniForm from '../CreateCollectiveMiniForm';
import FinancialContributionsFAQ from '../faqs/FinancialContributionsFAQ';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';
import { H1, H2, P } from '../Text';
import { withUser } from '../UserProvider';

import StripeOrBankAccountPicker from './StripeOrBankAccountPicker';

import acceptOrganizationIllustration from '../../public/static/images/create-collective/acceptContributionsOrganizationHoverIllustration.png';

const CreateNewOrg = styled(Flex)`
  border: 1px solid lightgray;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
`;

const OrgCard = styled(Flex)`
  cursor: pointer;
  border-radius: 10px;
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

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

class AcceptContributionsMyselfOrOrg extends React.Component {
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
      miniForm: false,
      organization: null,
    };
  }

  // GraphQL functions
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
        refetchQueries: [{ query: getCollectivePageQuery, variables: { slug: this.props.collective.slug } }],
        awaitRefetchQueries: true,
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
    const { error, miniForm, organization, loading } = this.state;

    // Get and filter orgs LoggedInUser is part of
    const memberships = uniqBy(
      LoggedInUser.memberOf.filter(m => m.role === 'ADMIN'),
      m => m.collective.id,
    );

    const orgs = memberships
      .filter(m => m.collective.type === 'ORGANIZATION')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    // Form values and submit
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

    // Conditional rendering
    const noOrganizationPicked = router.query.path === 'organization' && !organization;
    const organizationPicked = router.query.path === 'organization' && organization;
    const ableToChoseStripeOrBankAccount =
      organizationPicked || (!router.query.method && router.query.path === 'myself');

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
            {noOrganizationPicked ? (
              <Fragment>
                <Image src={acceptOrganizationIllustration} alt="" />
                <H2 fontSize="H5" fontWeight="bold" color="black.900" textAlign="center">
                  <FormattedMessage id="acceptContributions.organization.subtitle" defaultMessage="Our organization" />
                </H2>
              </Fragment>
            ) : (
              <Fragment>
                <Avatar collective={organizationPicked ? organization : LoggedInUser.collective} radius={64} mb={2} />
                <P fontSize="LeadParagraph" lineHeight="LeadCaption" fontWeight="bold" mb={3}>
                  {organizationPicked ? organization.name : LoggedInUser.collective.name}
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
              </Fragment>
            )}
          </Flex>
          {noOrganizationPicked && (
            <Flex flexDirection="column" justifyContent="center" alignItems="center" my={3} minWidth={'450px'}>
              <Flex px={3} width="100%">
                <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                  <FormattedMessage id="acceptContributions.organization.myOrgs" defaultMessage="My organizations" />
                </P>
                <Flex flexGrow={1} alignItems="center">
                  <StyledHr width="100%" ml={2} />
                </Flex>
              </Flex>
              {orgs.length > 0 && (
                <Flex px={3} width="100%" flexDirection="column">
                  {orgs.map(org => (
                    <OrgCard
                      alignItems="center"
                      key={org.collective.id}
                      my={2}
                      onClick={() => this.setState({ organization: org.collective })}
                    >
                      <Avatar radius={56} collective={org.collective} />
                      <Flex flexDirection="column" ml={3}>
                        <P color="black.900" mb={1}>
                          {org.collective.name}
                        </P>
                        <P color="black.600">@{org.collective.slug}</P>
                      </Flex>
                    </OrgCard>
                  ))}
                </Flex>
              )}
              <Flex px={3} width="100%">
                <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                  <FormattedMessage id="CollectivePicker.CreateNew" defaultMessage="Create new" />
                </P>
                <Flex flexGrow={1} alignItems="center">
                  <StyledHr width="100%" ml={2} />
                </Flex>
              </Flex>

              <Flex my={2} px={3} flexDirection="column" width="100%">
                {miniForm ? (
                  <CreateCollectiveMiniForm
                    type="ORGANIZATION"
                    onCancel={() => this.setState({ miniForm: false })}
                    onSuccess={data => this.setState({ organization: data })}
                    LoggedInUser={LoggedInUser}
                    addLoggedInUserAsAdmin
                    excludeAdminFields
                  />
                ) : (
                  <CreateNewOrg alignItems="center" onClick={() => this.setState({ miniForm: true })}>
                    <PlusCircle size="24" color="gray" />
                    <P fontSize="Caption" color="black.800" ml={2}>
                      <FormattedMessage id="Organization.CreateNew" defaultMessage="Create new Organization" />
                    </P>
                  </CreateNewOrg>
                )}
              </Flex>
            </Flex>
          )}
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
                              loading={loading}
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
          {ableToChoseStripeOrBankAccount && (
            <StripeOrBankAccountPicker
              LoggedInUser={LoggedInUser}
              hostCollectiveSlug={organization ? organization.slug : LoggedInUser.collective.slug}
              addHost={this.addHost}
              collective={collective}
            />
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

export default withUser(withRouter(addBankAccountMutation(addApplyToHostMutation(AcceptContributionsMyselfOrOrg))));
