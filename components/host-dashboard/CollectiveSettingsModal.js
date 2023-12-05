import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { clamp, isBoolean, isNil, round } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import EXPENSE_TYPE from '../../lib/constants/expenseTypes';
import { HOST_FEE_STRUCTURE } from '../../lib/constants/host-fee-structure';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { i18nExpenseType } from '../../lib/i18n/expense';

import { ALL_SECTIONS } from '../admin-panel/constants';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledInputGroup from '../StyledInputGroup';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import StyledRadioList from '../StyledRadioList';
import StyledSelect from '../StyledSelect';
import { Label, P } from '../Text';
import { useToast } from '../ui/useToast';

const OPTION_LABELS = defineMessages({
  [HOST_FEE_STRUCTURE.DEFAULT]: {
    id: 'CollectiveFeesForm.Default',
    defaultMessage: 'Use global host fees',
  },
  [HOST_FEE_STRUCTURE.CUSTOM_FEE]: {
    id: 'CollectiveFeesForm.CustomFees',
    defaultMessage: 'Set a custom fee for this Collective.',
  },
});

const getDefaultFee = (collective, host) => {
  if (isNil(collective.hostFeePercent) || collective.hostFeePercent === host.hostFeePercent) {
    return host.hostFeePercent;
  } else {
    return collective.hostFeePercent;
  }
};

const editAccountSettingsMutation = gql`
  mutation EditAccountSettings(
    $account: AccountReferenceInput!
    $hostFeePercent: Float!
    $isCustomFee: Boolean!
    $key: AccountSettingsKey!
    $value: JSON!
  ) {
    editAccountFeeStructure(account: $account, hostFeePercent: $hostFeePercent, isCustomFee: $isCustomFee) {
      id
      ... on AccountWithHost {
        hostFeesStructure
        hostFeePercent
      }
      childrenAccounts {
        nodes {
          id
          ... on AccountWithHost {
            hostFeesStructure
            hostFeePercent
          }
        }
      }
    }

    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const DISPLAYED_EXPENSE_TYPES = [EXPENSE_TYPE.INVOICE, EXPENSE_TYPE.RECEIPT, EXPENSE_TYPE.GRANT];

const EXPENSE_TYPE_OPTIONS = [
  { value: null, label: <FormattedMessage defaultMessage="Use global host settings" /> },
  { value: true, label: <FormattedMessage id="ExpenseType.Enabled" defaultMessage="Enabled" /> },
  { value: false, label: <FormattedMessage id="ExpenseType.Disabled" defaultMessage="Disabled" /> },
];

const EXPENSE_TYPE_SELECT_STYLES = {
  option: { fontSize: '12px' },
};

const CollectiveSettingsModal = ({ host, collective, ...props }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [hostFeePercent, setHostFeePercent] = useState(getDefaultFee(collective, host));
  const [selectedOption, setSelectedOption] = useState(
    hostFeePercent === host.hostFeePercent ? HOST_FEE_STRUCTURE.DEFAULT : HOST_FEE_STRUCTURE.CUSTOM_FEE,
  );

  const [expenseTypes, setExpenseTypes] = React.useState(() => collective.settings?.expenseTypes || {});
  const [submitEditSettings, { loading }] = useMutation(editAccountSettingsMutation, { context: API_V2_CONTEXT });
  const hasParent = Boolean(collective.parent);

  return (
    <StyledModal maxWidth={432} trapFocus {...props}>
      <CollectiveModalHeader collective={collective} mb={3} />
      <ModalBody>
        <P fontSize="16px" lineHeight="24px" fontWeight="500" mb={2}>
          <FormattedMessage defaultMessage="Expense types" />
        </P>
        <div>
          {DISPLAYED_EXPENSE_TYPES.map(expenseType => (
            <Flex key={expenseType} mb={3} alignItems="center">
              <Box mr={2} flex="0 1 70px">
                <Label htmlFor={`select-expense-type-${expenseType}`} fontWeight="normal">
                  {i18nExpenseType(intl, expenseType)}
                </Label>
              </Box>
              <StyledSelect
                inputId={`select-expense-type-${expenseType}`}
                fontSize="12px"
                minWidth={195}
                styles={EXPENSE_TYPE_SELECT_STYLES}
                options={EXPENSE_TYPE_OPTIONS}
                onChange={({ value }) => setExpenseTypes({ ...expenseTypes, [expenseType]: value })}
                value={
                  isBoolean(expenseTypes[expenseType])
                    ? EXPENSE_TYPE_OPTIONS.find(({ value }) => value === expenseTypes[expenseType])
                    : EXPENSE_TYPE_OPTIONS[0]
                }
              />
            </Flex>
          ))}
        </div>

        <P fontSize="16px" lineHeight="24px" fontWeight="500" mb={2}>
          <FormattedMessage id="CollectiveFeesForm.Title" defaultMessage="Set fee structure" />
        </P>

        {hasParent ? (
          <MessageBox type="info" withIcon lineHeight="18px">
            <FormattedMessage defaultMessage="Events and Projects inherit the host fees structure configuration of their parents." />
          </MessageBox>
        ) : (
          <React.Fragment>
            <P>
              <FormattedMessage defaultMessage="This change will also apply to all the projects and events created by this collective" />
            </P>

            <StyledRadioList
              id="fees-structure-radio"
              name="fees-structure-radio"
              options={[HOST_FEE_STRUCTURE.DEFAULT, HOST_FEE_STRUCTURE.CUSTOM_FEE]}
              value={selectedOption}
              onChange={({ value }) => setSelectedOption(value)}
            >
              {({ key, radio }) => (
                <Flex key={key} mt={3}>
                  <Box mr={12}>{radio}</Box>
                  <Box>
                    <P mb={2} fontWeight="500">
                      {intl.formatMessage(OPTION_LABELS[key])}
                    </P>
                    {key === HOST_FEE_STRUCTURE.DEFAULT && (
                      <P fontSize="11px" lineHeight="16px" color="black.600" fontWeight="normal">
                        <FormattedMessage
                          id="CollectiveFeesForm.DefaultDescription"
                          defaultMessage="Set the global (default) fee in your <Link>settings</Link>."
                          values={{
                            Link: getI18nLink({
                              as: Link,
                              href: `/${host.slug}/admin/${ALL_SECTIONS.FISCAL_HOSTING}`,
                              openInNewTab: true,
                            }),
                          }}
                        />
                      </P>
                    )}
                    {key === HOST_FEE_STRUCTURE.CUSTOM_FEE && (
                      <StyledInputGroup
                        append="%"
                        type="number"
                        min="0"
                        max="100"
                        maxWidth={120}
                        appendProps={{ color: 'black.600' }}
                        fontWeight="normal"
                        value={isNaN(hostFeePercent) ? '' : hostFeePercent}
                        step="0.01"
                        onClick={() => setSelectedOption(key)}
                        onChange={e => setHostFeePercent(parseFloat(e.target.value))}
                        onBlur={e => {
                          const newValue = clamp(round(parseFloat(e.target.value), 2), 0, 100);
                          setHostFeePercent(isNaN(newValue) ? host.hostFeePercent : newValue);
                        }}
                      />
                    )}
                  </Box>
                </Flex>
              )}
            </StyledRadioList>
          </React.Fragment>
        )}
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent="center">
          <StyledButton
            buttonStyle="primary"
            minWidth={90}
            loading={loading}
            onClick={async () => {
              const isCustomFee = selectedOption === HOST_FEE_STRUCTURE.CUSTOM_FEE;
              try {
                await submitEditSettings({
                  variables: {
                    account: { id: collective.id },
                    hostFeePercent: isCustomFee ? hostFeePercent : host.hostFeePercent,
                    isCustomFee,
                    key: 'expenseTypes',
                    value: expenseTypes,
                  },
                });

                props?.onClose();
              } catch (e) {
                toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
              }
            }}
          >
            <FormattedMessage id="save" defaultMessage="Save" />
          </StyledButton>
          <StyledButton ml={3} minWidth={90} onClick={props.onClose} disabled={loading}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

CollectiveSettingsModal.propTypes = {
  onClose: PropTypes.func,
  collective: PropTypes.shape({
    id: PropTypes.string,
    hostFeePercent: PropTypes.number,
    settings: PropTypes.object,
    parent: PropTypes.object,
    type: PropTypes.string,
  }).isRequired,
  host: PropTypes.shape({
    slug: PropTypes.string,
    hostFeePercent: PropTypes.number,
  }).isRequired,
};

export default CollectiveSettingsModal;
