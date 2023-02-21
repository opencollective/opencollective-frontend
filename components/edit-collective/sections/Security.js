import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ExternalLink } from '@styled-icons/feather/ExternalLink';
import { Formik } from 'formik';
import { get, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { margin } from 'styled-system';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledButton from '../../StyledButton';
import StyledCheckbox from '../../StyledCheckbox';
import StyledHr from '../../StyledHr';
import StyledInputAmount from '../../StyledInputAmount';
import StyledInputField from '../../StyledInputField';
import StyledLink from '../../StyledLink';
import { H4, P, Span } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import SettingsSectionTitle from './SettingsSectionTitle';

const accountQuery = gql`
  query Account($slug: String) {
    account(slug: $slug) {
      id
      slug
      name
      isHost
      settings
      currency
      policies {
        REQUIRE_2FA_FOR_ADMINS
      }
    }
  }
`;

const updateSecuritySettingsMutation = gql`
  mutation UpdateSecuritySettings(
    $account: AccountReferenceInput!
    $payoutsTwoFactorAuth: JSON!
    $require2FAForAdmins: Boolean!
  ) {
    editAccountSetting(account: $account, key: "payoutsTwoFactorAuth", value: $payoutsTwoFactorAuth) {
      id
      settings
    }
    setPolicies(account: $account, policies: { REQUIRE_2FA_FOR_ADMINS: $require2FAForAdmins }) {
      id
      policies {
        REQUIRE_2FA_FOR_ADMINS
      }
    }
  }
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 16px;
  border: 1px solid #dcdee0;
  font-weight: normal;
  transition: box-shadow 0.3s;
  border-radius: 8px;
  ${margin}
  &:hover {
    box-shadow: 0px 4px 12px rgba(20, 20, 20, 0.1);
  }
`;

const getInitialValues = account => {
  return {
    require2FAForAdmins: get(account, 'policies.REQUIRE_2FA_FOR_ADMINS', false),
    payoutsTwoFactorAuth: {
      enabled: get(account, 'settings.payoutsTwoFactorAuth.enabled', false),
      rollingLimit: get(account, 'settings.payoutsTwoFactorAuth.rollingLimit', 1000000),
    },
  };
};

const Security = ({ collective }) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const { data, loading } = useQuery(accountQuery, { variables: { slug: collective.slug }, context: API_V2_CONTEXT });
  const [updateSecuritySettings, { loading: submitting }] = useMutation(updateSecuritySettingsMutation, {
    context: API_V2_CONTEXT,
  });

  if (loading) {
    return <LoadingPlaceholder height={300} />;
  }

  return (
    <Formik
      enableReinitialize
      initialValues={getInitialValues(data.account)}
      onSubmit={async values => {
        try {
          await updateSecuritySettings({ variables: { account: pick(data.account, ['id']), ...values } });
          addToast({
            type: TOAST_TYPE.SUCCESS,
            message: <FormattedMessage id="Settings.Updated" defaultMessage="Settings updated." />,
          });
        } catch (error) {
          addToast({
            type: TOAST_TYPE.ERROR,
            title: <FormattedMessage id="Settings.Updated.Fail" defaultMessage="Update failed." />,
            message: i18nGraphqlException(intl, error),
          });
        }
      }}
    >
      {({ handleSubmit, setFieldValue, values, dirty }) => (
        <form onSubmit={handleSubmit}>
          <SettingsSectionTitle>
            <FormattedMessage id="TwoFactorAuth" defaultMessage="Two-factor authentication" />
          </SettingsSectionTitle>
          <Container mb="26px">
            <P color="black.700" fontSize="14px" lineHeight="20px" mb={24}>
              <FormattedMessage
                id="TwoFactorAuth.Setup.FiscalHost.Info"
                defaultMessage="Two-factor authentication (2FA) adds an extra layer of security when logging in. For Fiscal Hosts or Collectives that manage their own funds, 2FA helps ensure payouts are secure."
              />
            </P>
            <CheckboxContainer htmlFor="enable-enforce-2fa-checkbox">
              <Box width="32px">
                <StyledCheckbox
                  inputId="enable-enforce-2fa-checkbox"
                  name="enable-enforce-2fa"
                  fontSize="14px"
                  checked={values.require2FAForAdmins}
                  width="auto"
                  onChange={() => setFieldValue('require2FAForAdmins', !values.require2FAForAdmins)}
                />
              </Box>
              <Box flex="1 1">
                <P fontSize="16px" lineHeight="24px" fontWeight="700">
                  <FormattedMessage
                    defaultMessage="All {account} admins must have 2FA"
                    values={{ account: data.account.name }}
                  />
                </P>
                <P mt="5px" color="black.700" fontSize="14px" lineHeight="20px">
                  <FormattedMessage defaultMessage="Checking this will require all admins of your team to activate a two-factor authentication to perform admin tasks like payouts." />
                </P>
              </Box>
            </CheckboxContainer>
          </Container>
          {data.account.isHost && (
            <Container>
              <H4 htmlFor="rollingLimit" mb="16px" fontSize="16px" lineHeight="24px">
                <FormattedMessage id="editCollective.rollingLimit.label" defaultMessage="Rolling payout limit" />
              </H4>
              <CheckboxContainer htmlFor="enable-rolling-limit-checkbox" mb={24}>
                <Box width="32px">
                  <StyledCheckbox
                    inputId="enable-rolling-limit-checkbox"
                    name="enable-rolling-limit"
                    checked={values.payoutsTwoFactorAuth.enabled}
                    width="auto"
                    onChange={() => setFieldValue('payoutsTwoFactorAuth.enabled', !values.payoutsTwoFactorAuth.enabled)}
                  />
                </Box>
                <Box flex="1 1">
                  <P fontSize="16px" lineHeight="24px" fontWeight="700">
                    <FormattedMessage defaultMessage="Enable rolling limit 2FA for payouts" />
                  </P>
                  <P mt="5px" color="black.700" fontSize="14px" lineHeight="20px">
                    <FormattedMessage defaultMessage="Admins will be asked to authenticate with 2FA code when they make the first payment after turning it on, and again once they've hit the rolling limit." />
                  </P>
                </Box>
              </CheckboxContainer>
              {values.payoutsTwoFactorAuth.enabled && (
                <StyledInputField name="rollingLimit" htmlFor="rollingLimit" disabled={loading} mr="24px">
                  {inputProps => (
                    <StyledInputAmount
                      {...inputProps}
                      currency={data.account.currency}
                      type="number"
                      fontSize="14px"
                      value={values.payoutsTwoFactorAuth.rollingLimit}
                      onChange={value => setFieldValue('payoutsTwoFactorAuth.rollingLimit', value)}
                      min={100}
                      precision={2}
                      disabled={!values.payoutsTwoFactorAuth.enabled}
                      px="2px"
                      placeholder={intl.formatMessage({
                        id: 'collective.contributionPolicy.placeholder',
                        defaultMessage: 'E.g. what types of contributions you will and will not accept.',
                      })}
                    />
                  )}
                </StyledInputField>
              )}
            </Container>
          )}
          <P mt={26} fontWeight="500">
            <StyledLink
              openInNewTab
              href={
                data.account.isHost
                  ? 'https://docs.opencollective.com/help/fiscal-hosts/payouts/two-factor-authentication-for-payouts'
                  : 'https://docs.opencollective.com/help/product/two-factor-authentication'
              }
            >
              <span>
                <FormattedMessage defaultMessage="Read the documentation about 2FA" />
              </span>
              <Span ml="6px">
                <ExternalLink size="1.1em" strokeWidth={2} style={{ marginBottom: 3 }} />
              </Span>
            </StyledLink>
          </P>
          <StyledHr borderColor="black.400" my={4} />
          <div>
            <StyledButton buttonStyle="primary" minWidth={100} type="submit" loading={submitting} disabled={!dirty}>
              <FormattedMessage id="save" defaultMessage="Save" />
            </StyledButton>
          </div>
        </form>
      )}
    </Formik>
  );
};

Security.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
};

export default Security;
