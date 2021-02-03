import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  checkVATNumberFormat,
  getVatOriginCountry,
  getVatPercentage,
  GST_RATE_PERCENT,
  TaxType,
} from '@opencollective/taxes';
import { Close } from '@styled-icons/material/Close';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import tiersTypes from '../../lib/constants/tiers-types';
import { formatCurrency } from '../../lib/currency-utils';
import { propTypeCountry } from '../../lib/custom-prop-types';
import getPaymentMethodFees from '../../lib/fees';
import { capitalize } from '../../lib/utils';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import InputTypeCountry from '../InputTypeCountry';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

const AmountLine = styled.div.attrs({
  'data-cy': 'breakdown-line',
})`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 8px 0;
`;

const Label = styled.span`
  min-width: 210px;
  font-size: 14px;
  margin-right: 4px;
`;

const FeesBreakdown = ({ amount, platformFeePercent, hostFeePercent, paymentMethod, currency }) => {
  const platformFee = amount * (platformFeePercent / 100);
  const hostFee = amount * ((hostFeePercent || 0) / 100);
  const pmFeeInfo = getPaymentMethodFees(paymentMethod, amount, currency);
  const netAmountForCollective = amount - platformFee - hostFee - pmFeeInfo.fee;

  return (
    <React.Fragment>
      <AmountLine>
        <Label fontWeight={500} color="black.800">
          <FormattedMessage id="contribution.netAmountForCollective" defaultMessage="Net amount for Collective" />
        </Label>
        <Span fontSize="16px" fontWeight={500} color="black.700">
          {formatCurrency(netAmountForCollective, currency)}
        </Span>
      </AmountLine>
      {Boolean(platformFee) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="PlatformFee" defaultMessage="Platform fee" />
            {` (-${platformFeePercent}%)`}
          </Label>
          <Span fontSize="16px" color="black.500">
            {formatCurrency(platformFee, currency)}
          </Span>
        </AmountLine>
      )}
      {Boolean(hostFeePercent) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.hostFeePercent" defaultMessage="Fiscal Host fee" />
            {` (-${hostFeePercent}%)`}
          </Label>
          <Span fontSize="16px" color="black.500">
            {formatCurrency(hostFee, currency)}
          </Span>
        </AmountLine>
      )}
      {Boolean(pmFeeInfo.fee) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />
            {' ('}
            {pmFeeInfo.aboutURL ? (
              <StyledLink href={pmFeeInfo.aboutURL} openInNewTab>
                {capitalize(paymentMethod.service)}
              </StyledLink>
            ) : (
              capitalize(paymentMethod.service)
            )}
            {`, ${pmFeeInfo.isExact ? '-' : '~'}${pmFeeInfo.feePercent.toFixed(1)}%)`}
          </Label>
          <Span fontSize="16px" color="black.500">
            {!pmFeeInfo.isExact && '~ '}
            {formatCurrency(pmFeeInfo.fee, currency)}
          </Span>
        </AmountLine>
      )}
      <StyledHr borderStyle="dashed" my={3} />
    </React.Fragment>
  );
};

FeesBreakdown.propTypes = {
  amount: PropTypes.object,
  platformFeePercent: PropTypes.object,
  hostFeePercent: PropTypes.object,
  paymentMethod: PropTypes.object,
  currency: PropTypes.string,
};

FeesBreakdown.defaultProps = {
  platformFeePercent: 5,
};

const ClickableLabel = styled(Container)``;
ClickableLabel.defaultProps = {
  display: 'inline-block',
  borderBottom: '1px dashed',
  borderColor: 'black.400',
  fontSize: '14px',
  color: 'black.500',
  cursor: 'pointer',
  mb: 2,
};

/** Add missing fields to taxInfo and calculate tax amount */
const prepareTaxInfo = (taxes, userTaxInfo, amount, quantity, taxPercentage, hasForm) => {
  return {
    ...userTaxInfo,
    taxType: taxes[0]?.type,
    percentage: taxPercentage,
    amount: Math.round(amount * quantity * (taxPercentage / 100)),
    isReady: Boolean(!hasForm && (!amount || get(userTaxInfo, 'countryISO'))),
  };
};

const getTaxPerentageForProfile = (taxes, tierType, hostCountry, collectiveCountry, profile) => {
  if (taxes.some(({ type }) => type === TaxType.VAT)) {
    const originCountry = getVatOriginCountry(tierType, hostCountry, collectiveCountry);
    return getVatPercentage(tierType, originCountry, get(profile, 'countryISO'), get(profile, 'number'));
  } else if (taxes.some(({ type }) => type === TaxType.GST)) {
    return GST_RATE_PERCENT;
  } else {
    return 0;
  }
};

const VATInputs = ({ currency, taxInfo, dispatchChange, setFormState, formState }) => {
  const hasConfirmedTaxID = taxInfo.number && taxInfo.isReady;
  const vatShortLabel = <FormattedMessage id="tax.vatShort" defaultMessage="VAT" />;

  return (
    <React.Fragment>
      <AmountLine my={3}>
        <Flex flexDirection="column">
          <Container display="flex" alignItems="center">
            <Span fontSize="14px" fontWeight="bold" mr={2}>
              {vatShortLabel}
            </Span>
            <InputTypeCountry
              minWidth={250}
              maxMenuHeight={100}
              onChange={code => dispatchChange({ countryISO: code, number: null })}
              value={taxInfo.countryISO}
              error={!taxInfo.countryISO}
              autoDetect
            />
          </Container>
          {taxInfo.countryISO && (
            <Box mt={3}>
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
                  <Container display="flex" ml={[-20, -26]} alignItems="center">
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
                      name="taxIndentificationNumber"
                      mx={[1, 2]}
                      px={2}
                      py={1}
                      autoFocus
                      required
                      maxWidth={180}
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
        <Span fontSize="16px" pt={2}>
          {taxInfo.isReady && `+ ${formatCurrency(taxInfo.amount, currency)}`}
        </Span>
      </AmountLine>
    </React.Fragment>
  );
};

VATInputs.propTypes = {
  formState: PropTypes.object,
  taxInfo: PropTypes.object,
  currency: PropTypes.string,
  dispatchChange: PropTypes.func,
  setFormState: PropTypes.func,
};

/**
 * Breakdowns a total amount to show the user where the money goes.
 */
const StepSummary = ({
  stepProfile,
  stepDetails,
  collective,
  paymentMethod,
  showFees,
  applyTaxes,
  taxes,
  data,
  onChange,
  tier,
}) => {
  const { amount, quantity } = stepDetails;
  const tierType = tier?.type;
  const hostCountry = get(collective.host, 'location.country');
  const collectiveCountry = collective.location.country || get(collective.parent, 'location.country');

  const currency = tier?.amount.currency || collective.currency;

  const [formState, setFormState] = useState({ isEnabled: false, error: false });
  const taxPercentage = getTaxPerentageForProfile(taxes, tierType, hostCountry, collectiveCountry, data);
  const taxInfo = prepareTaxInfo(taxes, data, amount, quantity, taxPercentage, formState.isEnabled);

  // Helper to prepare onChange data
  const dispatchChange = (newValues, hasFormParam) => {
    if (onChange) {
      const newTaxInfo = { ...taxInfo, ...newValues };
      const percent = getTaxPerentageForProfile(taxes, tierType, hostCountry, collectiveCountry, newTaxInfo);
      const hasForm = hasFormParam === undefined ? formState.isEnabled : hasFormParam;
      return onChange({
        stepSummary: prepareTaxInfo(taxes, newTaxInfo, amount, quantity, percent, hasForm),
      });
    }
  };

  useEffect(() => {
    // Dispatch initial value on mount
    dispatchChange({
      countryISO: data?.countryISO || get(stepProfile, 'location.country'),
      number: data?.number || get(stepProfile, 'settings.VAT.number'),
    });
  }, []);

  return (
    <Box width="100%" px={[0, null, null, 3]}>
      {showFees && (
        <FeesBreakdown
          platformFeePercent={collective.platformFeePercent}
          hostFeePercent={collective.hostFeePercent}
          currency={currency}
          paymentMethod={paymentMethod}
          amount={amount}
        />
      )}
      {quantity && (tierType === 'TICKET' || quantity > 1) && (
        <React.Fragment>
          <AmountLine my={3}>
            <Label fontWeight="bold">
              <FormattedMessage id="contribution.quantity" defaultMessage="Quantity" />
            </Label>
            <Span fontSize="16px">{quantity}</Span>
          </AmountLine>
          <AmountLine my={3}>
            <Label fontWeight="bold">
              <FormattedMessage id="contribution.itemPrice" defaultMessage="Item price" />
            </Label>
            <Span fontSize="16px">
              {amount ? formatCurrency(amount, currency) : <FormattedMessage id="Amount.Free" defaultMessage="Free" />}
            </Span>
          </AmountLine>
        </React.Fragment>
      )}
      <AmountLine my={3}>
        <Label fontWeight="bold">
          <FormattedMessage id="contribution.your" defaultMessage="Your contribution" />
        </Label>
        <Span fontSize="16px">{formatCurrency(amount * quantity, currency)}</Span>
      </AmountLine>
      {applyTaxes && amount > 0 && (
        <div>
          {taxes.some(({ type }) => type === TaxType.VAT) && (
            <VATInputs
              currency={currency}
              dispatchChange={dispatchChange}
              setFormState={setFormState}
              formState={formState}
              taxInfo={taxInfo}
            />
          )}
          {taxes.some(({ type }) => type === TaxType.GST) && (
            <AmountLine>
              <Span fontSize="16px" pt={2}>
                GST ({taxPercentage}%)
              </Span>
              <Span fontSize="16px" pt={2}>
                {`+ ${formatCurrency(taxInfo.amount, currency)}`}
              </Span>
            </AmountLine>
          )}
        </div>
      )}
      <StyledHr my={3} />
      <AmountLine>
        <Label fontWeight="bold">
          <FormattedMessage id="contribution.total" defaultMessage="TOTAL" />
        </Label>
        <Span fontWeight="bold" fontSize="16px" color={taxInfo.isReady ? 'black.800' : 'black.400'}>
          {formatCurrency(amount * quantity + (taxInfo.isReady ? taxInfo.amount : 0), currency)}
        </Span>
      </AmountLine>
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
    amount: PropTypes.numer,
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
  /** Do we want to show the fees? */
  showFees: PropTypes.bool,
  /** Called with the step info as `{countryCode, taxInfoNumber, isValid}`  */
  onChange: PropTypes.func.isRequired,
  taxes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(TaxType))),
};

StepSummary.defaultProps = {
  showFees: true,
};

export default StepSummary;
