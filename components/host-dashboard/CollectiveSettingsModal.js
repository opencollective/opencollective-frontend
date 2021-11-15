import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { clamp, isNil, round } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { accountSupportsGrants } from '../../lib/collective.lib';
import { CollectiveType } from '../../lib/constants/collectives';
import { HOST_FEE_STRUCTURE } from '../../lib/constants/host-fee-structure';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { EDIT_COLLECTIVE_SECTIONS } from '../edit-collective/Menu';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputGroup from '../StyledInputGroup';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import StyledRadioList from '../StyledRadioList';
import { P } from '../Text';

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

const editAccountSettingsMutation = gqlV2/* GraphQL */ `
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
    }

    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const CollectiveSettingsModal = ({ host, collective, ...props }) => {
  const intl = useIntl();
  const [hostFeePercent, setHostFeePercent] = useState(getDefaultFee(collective, host));
  const [selectedOption, setSelectedOption] = useState(
    hostFeePercent === host.hostFeePercent ? HOST_FEE_STRUCTURE.DEFAULT : HOST_FEE_STRUCTURE.CUSTOM_FEE,
  );
  const isProjectOrFund = [CollectiveType.FUND, CollectiveType.PROJECT].includes(collective.type);
  const [hasGrant, setHasGrant] = useState(accountSupportsGrants(collective, host) || isProjectOrFund);
  const [submitFeesStructure, { loading, error }] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  return (
    <StyledModal show maxWidth={432} trapFocus {...props}>
      <CollectiveModalHeader collective={collective} mb={3} />
      <ModalBody>
        <P fontSize="16px" lineHeight="24px" fontWeight="500" mb={2}>
          <FormattedMessage defaultMessage="Expense types" />
        </P>
        <Flex mb="23px" mx="8px" justifyContent="space-between">
          <StyledCheckbox
            name="grant"
            fontSize="12px"
            defaultChecked={hasGrant}
            label={
              <P fontWeight="500">
                <FormattedMessage defaultMessage="Enable grants" />
              </P>
            }
            onChange={({ checked }) => {
              setHasGrant(checked);
            }}
          />
        </Flex>

        <P fontSize="16px" lineHeight="24px" fontWeight="500" mb={2}>
          <FormattedMessage id="CollectiveFeesForm.Title" defaultMessage="Set fee structure" />
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
                          href: `/${host.slug}/admin/${EDIT_COLLECTIVE_SECTIONS.FISCAL_HOSTING}`,
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
                    maxWidth={90}
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
        {error && <MessageBoxGraphqlError error={error} mt={3} fontSize="13px" />}
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent="center">
          <StyledButton
            buttonStyle="primary"
            minWidth={90}
            loading={loading}
            onClick={() => {
              const isCustomFee = selectedOption === HOST_FEE_STRUCTURE.CUSTOM_FEE;
              return submitFeesStructure({
                variables: {
                  account: { id: collective.id },
                  hostFeePercent: isCustomFee ? hostFeePercent : host.hostFeePercent,
                  isCustomFee,
                  key: 'expenseTypes',
                  value: { hasGrant },
                },
              }).then(props.onClose);
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
    type: PropTypes.string,
  }).isRequired,
  host: PropTypes.shape({
    slug: PropTypes.string,
    hostFeePercent: PropTypes.number,
    settings: PropTypes.shape({
      disableGrantsByDefault: PropTypes.bool,
    }),
  }).isRequired,
};

export default CollectiveSettingsModal;
