import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  checkVATNumberFormat,
  getGstPercentage,
  getVatOriginCountry,
  getVatPercentage,
  TaxType,
} from '@opencollective/taxes';
import { Close } from '@styled-icons/material/Close';
import { get, isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import tiersTypes from '../../lib/constants/tiers-types';
import { propTypeCountry } from '../../lib/custom-prop-types';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import InputTypeCountry from '../InputTypeCountry';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import { Span } from '../Text';

import ContributionSummary from './ContributionSummary';

const ClickableLabel = styled(Container).attrs({
  display: 'inline-block',
  borderBottom: '1px dashed',
  borderColor: 'black.400',
  fontSize: '13px',
  color: 'black.500',
  cursor: 'pointer',
  mb: 2,
})``;

/** Add missing fields to taxInfo and calculate tax amount */
const prepareTaxInfo = (taxes, userTaxInfo, amount, quantity, taxPercentage, hasForm) => {
  return {
    ...userTaxInfo,
    taxType: taxes[0]?.type,
    percentage: taxPercentage,
    amount: Math.round(amount * quantity * (taxPercentage / 100)),
    isReady: Boolean(!hasForm && amount && get(userTaxInfo, 'countryISO')),
  };
};

const getTaxPercentageForProfile = (taxes, tierType, hostCountry, collectiveCountry, newTaxInfo) => {
  if (taxes.some(({ type }) => type === TaxType.VAT)) {
    const originCountry = getVatOriginCountry(tierType, hostCountry, collectiveCountry);
    return getVatPercentage(tierType, originCountry, get(newTaxInfo, 'countryISO'), get(newTaxInfo, 'number'));
  } else if (taxes.some(({ type }) => type === TaxType.GST)) {
    return getGstPercentage(tierType, hostCountry, get(newTaxInfo, 'countryISO'));
  } else {
    return 0;
  }
};

const COUNTRY_SELECT_STYLES = {
  dropdownIndicator: { paddingTop: 0, paddingBottom: 0 },
  option: { fontSize: '12px', color: 'red' },
  control: { minHeight: '32px' },
};

const VATInputs = ({ AmountLine, Amount, Label, currency, taxInfo, dispatchChange, setFormState, formState }) => {
  const hasConfirmedTaxID = taxInfo.number && taxInfo.isReady;
  const vatShortLabel = <FormattedMessage id="tax.vatShort" defaultMessage="VAT" />;
  return (
    <AmountLine my={3}>
      <Flex flexDirection="column">
        <Flex alignItems="center" flexWrap="wrap">
          <Label mr={2} flex="1 1 auto" whiteSpace="nowrap">
            {vatShortLabel}
          </Label>
          <Box flex="1 1 180px">
            <InputTypeCountry
              inputId="step-summary-location"
              minWidth={100}
              maxWidth={190}
              maxMenuHeight={150}
              onChange={code => dispatchChange({ countryISO: code, number: null })}
              value={taxInfo.countryISO}
              error={!taxInfo.countryISO}
              styles={COUNTRY_SELECT_STYLES}
              fontSize="12px"
              autoDetect
            />
          </Box>
        </Flex>
        {taxInfo.countryISO && (
          <Box mt={2}>
            {hasConfirmedTaxID && !formState.isEnabled ? (
              <Flex>
                <Span mr={3}>{taxInfo.number}</Span>
                <ClickableLabel
                  onClick={() => {
                    setFormState({ isEnabled: true, error: false });
                    dispatchChange(null, true);
                  }}
                >
                  <FormattedMessage
                    id="contribute.changeTaxNumber"
                    defaultMessage="Change {taxName} number"
                    values={{ taxName: vatShortLabel }}
                  />
                </ClickableLabel>
              </Flex>
            ) : (
              <ClickableLabel
                onClick={() => {
                  if (!formState.isEnabled) {
                    setFormState({ isEnabled: true, error: false });
                    dispatchChange(null, true);
                  }
                }}
              >
                <FormattedMessage
                  id="contribute.enterTaxNumber"
                  defaultMessage="Enter {taxName} number (if you have one)"
                  values={{ taxName: vatShortLabel }}
                />
              </ClickableLabel>
            )}
            {formState.isEnabled && (
              <Flex flexDirection="column" className="cf-tax-form">
                <Container display="flex" alignItems="center" ml={[null, null, '-24px']}>
                  <Close
                    data-cy="remove-vat-btn"
                    size={16}
                    color="#333333"
                    cursor="pointer"
                    aria-label="Remove"
                    onClick={() => {
                      setFormState({ isEnabled: false, error: false });
                      dispatchChange({ number: null }, false);
                    }}
                  />
                  <StyledInput
                    value={taxInfo.number || ''}
                    name="taxIdNumber"
                    mx={[1, 2]}
                    px={2}
                    py={1}
                    autoFocus
                    fontSize="13px"
                    required
                    maxWidth={180}
                    error={formState.error}
                    onBlur={e => {
                      const rawNumber = e.target.value;
                      let error = false;
                      let validationResult = checkVATNumberFormat(rawNumber);
                      if (!validationResult.isValid) {
                        // Try again with the country code
                        validationResult = checkVATNumberFormat(`${taxInfo.countryISO}${rawNumber}`);
                        if (!validationResult.isValid) {
                          error = 'invalid';
                        }
                      } else if (get(validationResult, 'country.isoCode.short') !== taxInfo.countryISO) {
                        error = 'bad_country';
                      }

                      const number = !error ? validationResult.value : rawNumber;
                      const hasError = Boolean(error);
                      setFormState({ isEnabled: true, error: error });
                      dispatchChange({ number }, hasError);
                    }}
                    onChange={e => {
                      setFormState({ isEnabled: true, error: false });
                      dispatchChange({ number: e.target.value });
                    }}
                  />
                  <StyledButton
                    buttonSize="tiny"
                    disabled={formState.error}
                    onClick={() => {
                      setFormState({ isEnabled: false });
                    }}
                  >
                    <FormattedMessage id="save" defaultMessage="Save" />
                  </StyledButton>
                </Container>
                {formState.error === 'invalid' && (
                  <Span mt={1} fontSize="12px" color="red.500">
                    <FormattedMessage
                      id="contribute.taxInfoInvalid"
                      defaultMessage="Invalid {taxName} number"
                      values={{ taxName: vatShortLabel }}
                    />
                  </Span>
                )}
                {formState.error === 'bad_country' && (
                  <Span mt={1} fontSize="12px" color="red.500">
                    <FormattedMessage
                      id="contribute.vatBadCountry"
                      defaultMessage="The VAT number doesn't match the country"
                    />
                  </Span>
                )}
              </Flex>
            )}
          </Box>
        )}
      </Flex>
      <Amount pt={2} ml={2} data-cy="VAT-amount">
        <FormattedMoneyAmount
          amount={taxInfo.amount}
          currency={currency}
          amountStyles={{ color: 'black.700', fontWeight: 400 }}
        />
      </Amount>
    </AmountLine>
  );
};

VATInputs.propTypes = {
  formState: PropTypes.object,
  taxInfo: PropTypes.object,
  currency: PropTypes.string,
  dispatchChange: PropTypes.func,
  setFormState: PropTypes.func,
  AmountLine: PropTypes.node,
  Amount: PropTypes.node,
  Label: PropTypes.node,
};

const GSTInputs = ({ AmountLine, Amount, Label, currency, taxInfo, dispatchChange }) => {
  const gstShortLabel = <FormattedMessage id="tax.gstShort" defaultMessage="GST" />;
  return (
    <AmountLine my={3}>
      <Flex flexDirection="column" width="100%">
        <Flex alignItems="center" flexWrap="wrap">
          <Label mr={2} flex="0 1 30px" whiteSpace="nowrap">
            {gstShortLabel}
          </Label>
          <Box flex="1 1 auto">
            <InputTypeCountry
              inputId="step-summary-location"
              minWidth={100}
              maxWidth={190}
              maxMenuHeight={150}
              value={taxInfo.countryISO}
              error={!taxInfo.countryISO}
              styles={COUNTRY_SELECT_STYLES}
              fontSize="12px"
              autoDetect
              onChange={code =>
                dispatchChange({
                  countryISO: code,
                  number: null,
                })
              }
            />
          </Box>
        </Flex>
      </Flex>
      <Amount pt={2} ml={2} data-cy="GST-amount">
        <FormattedMoneyAmount
          amount={taxInfo.amount}
          currency={currency}
          amountStyles={{ color: 'black.700', fontWeight: 400 }}
        />
      </Amount>
    </AmountLine>
  );
};

GSTInputs.propTypes = {
  taxInfo: PropTypes.object,
  currency: PropTypes.string,
  dispatchChange: PropTypes.func,
  AmountLine: PropTypes.node,
  Amount: PropTypes.node,
  Label: PropTypes.node,
};

/**
 * Breakdowns a total amount to show the user where the money goes.
 */
const StepSummary = ({
  stepProfile,
  stepDetails,
  collective,
  stepPayment,

  applyTaxes,
  taxes,
  data,
  onChange,
  tier,
}) => {
  const { amount, quantity } = stepDetails;
  const tierType = tier?.type;
  const hostCountry = get(collective.host, 'location.country');
  const collectiveCountry = collective.location?.country || get(collective.parent, 'location.country');
  const currency = tier?.amount.currency || collective.currency;

  const [formState, setFormState] = useState({ isEnabled: false, error: false });
  const taxPercentage = getTaxPercentageForProfile(taxes, tierType, hostCountry, collectiveCountry, data);
  const taxInfo = prepareTaxInfo(taxes, data, amount, quantity, taxPercentage, formState.isEnabled);

  // Set a tax renderer component
  let TaxRenderer = null;
  if (applyTaxes && amount > 0 && taxInfo.taxType) {
    if (taxInfo.taxType === TaxType.VAT) {
      TaxRenderer = VATInputs;
    } else if (taxInfo.taxType === TaxType.GST) {
      TaxRenderer = GSTInputs;
    }
  }

  // Helper to prepare onChange data
  const dispatchChange = (newValues, hasFormParam) => {
    if (onChange) {
      const newTaxInfo = { ...taxInfo, ...newValues };
      const percent = getTaxPercentageForProfile(taxes, tierType, hostCountry, collectiveCountry, newTaxInfo);
      const hasForm = hasFormParam === undefined ? formState.isEnabled : hasFormParam;
      return onChange({
        stepSummary: prepareTaxInfo(taxes, newTaxInfo, amount, quantity, percent, hasForm),
      });
    }
  };

  useEffect(() => {
    if (!isEmpty(taxes)) {
      // Dispatch initial value on mount
      dispatchChange({
        countryISO: data?.countryISO || get(stepProfile, 'location.country'),
        number: data?.number || get(stepProfile, 'settings.VAT.number'),
      });
    } else if (!data?.isReady) {
      // Remove stepSummary if taxes are not applied
      onChange({ stepSummary: { isReady: true } });
    }
  }, [taxes]);

  return (
    <Box width="100%" px={[0, null, null, 2]}>
      <ContributionSummary
        collective={collective}
        stepDetails={stepDetails}
        stepSummary={data}
        stepPayment={stepPayment}
        currency={currency}
        tier={tier}
        renderTax={
          TaxRenderer &&
          (({ Amount, Label, AmountLine }) => (
            <TaxRenderer
              currency={currency}
              dispatchChange={dispatchChange}
              setFormState={setFormState}
              formState={formState}
              taxInfo={taxInfo}
              Amount={Amount}
              Label={Label}
              AmountLine={AmountLine}
            />
          ))
        }
      />
    </Box>
  );
};

StepSummary.propTypes = {
  stepDetails: PropTypes.shape({
    /** The total amount without tax in cents */
    amount: PropTypes.number.isRequired,
    /** Number of items to order */
    quantity: PropTypes.number,
  }),
  stepProfile: PropTypes.shape({
    location: PropTypes.shape({
      country: propTypeCountry,
    }),
  }),
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    /** Host fees, as an integer percentage */
    hostFeePercent: PropTypes.number,
    /** Platform fee */
    platformFeePercent: PropTypes.number,
    location: PropTypes.shape({
      country: propTypeCountry,
    }),
    parent: PropTypes.shape({
      location: PropTypes.shape({
        country: propTypeCountry,
      }),
    }),
    host: PropTypes.shape({
      location: PropTypes.shape({
        country: propTypeCountry,
      }),
    }),
  }),
  stepPayment: PropTypes.object,
  /** If we need to activate tax for this order */
  applyTaxes: PropTypes.bool,
  /** The tax identification information from user */
  data: PropTypes.shape({
    /** Country ISO of the contributing profile. Used to see what taxes applies */
    countryISO: PropTypes.string,
    /** The tax identification numer */
    number: PropTypes.string,
    /** A flag to indicate if the form is ready to be submitted */
    isReady: PropTypes.bool,
    /** The tax amount in cents */
    amount: PropTypes.number,
  }),
  /** Type of the tier. Used to check if taxes apply */
  tier: PropTypes.shape({
    type: PropTypes.oneOf(tiersTypes),
    amount: PropTypes.shape({
      currency: PropTypes.string,
    }),
  }),
  /** Payment method, used to generate label and payment fee */
  paymentMethod: PropTypes.shape({
    /** Payment method service provider */
    service: PropTypes.string,
    /** Payment method type */
    type: PropTypes.string,
    /** Payment method currency */
    currency: PropTypes.string,
  }),
  /** Called with the step info as `{countryCode, taxInfoNumber, isValid}`  */
  onChange: PropTypes.func.isRequired,
  taxes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(TaxType))),
};

export default StepSummary;
