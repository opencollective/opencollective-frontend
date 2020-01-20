import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { checkVATNumberFormat, getVatPercentage, getVatOriginCountry } from '@opencollective/taxes';

import { Close } from '@styled-icons/material/Close';

import tiersTypes from '../../lib/constants/tiers-types';
import { propTypeCountry } from '../../lib/custom-prop-types';
import { formatCurrency, capitalize } from '../../lib/utils';
import getPaymentMethodFees from '../../lib/fees';
import fetchGeoLocation from '../../lib/geolocation_api';
import StyledCard from '../StyledCard';
import { Span } from '../Text';
import StyledHr from '../StyledHr';
import ExternalLink from '../ExternalLink';
import InputTypeCountry from '../InputTypeCountry';
import Container from '../Container';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';

const AmountLine = styled(Flex)``;
AmountLine.defaultProps = {
  justifyContent: 'space-between',
  my: 2,
  flexWrap: 'wrap',
  className: 'breakdown-line',
};

const Label = styled(Span)`
  min-width: 210px;
`;
Label.defaultProps = {
  fontSize: 'Paragraph',
  mr: 1,
};

const FeesBreakdown = ({ amount, platformFeePercent, hostFeePercent, paymentMethod, currency }) => {
  const platformFee = amount * (platformFeePercent / 100);
  const hostFee = amount * (hostFeePercent / 100);
  const pmFeeInfo = getPaymentMethodFees(paymentMethod, amount);
  const netAmountForCollective = amount - platformFee - hostFee - pmFeeInfo.fee;

  return (
    <React.Fragment>
      <AmountLine>
        <Label fontWeight={500} color="black.800">
          <FormattedMessage id="contribution.netAmountForCollective" defaultMessage="Net amount for collective" />
        </Label>
        <Span fontSize="LeadParagraph" fontWeight={500} color="black.700">
          {formatCurrency(netAmountForCollective, currency)}
        </Span>
      </AmountLine>
      {Boolean(platformFee) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="PlatformFee" defaultMessage="Platform fee" />
            {` (-${platformFeePercent}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
            {formatCurrency(platformFee, currency)}
          </Span>
        </AmountLine>
      )}
      {Boolean(hostFeePercent) && (
        <AmountLine>
          <Label color="black.500">
            <FormattedMessage id="contribution.hostFeePercent" defaultMessage="Fiscal host fee" />
            {` (-${hostFeePercent}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
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
              <ExternalLink href={pmFeeInfo.aboutURL} openInNewTab>
                {capitalize(paymentMethod.service)}
              </ExternalLink>
            ) : (
              capitalize(paymentMethod.service)
            )}
            {`, ${pmFeeInfo.isExact ? '-' : '~'}${pmFeeInfo.feePercent.toFixed(1)}%)`}
          </Label>
          <Span fontSize="LeadParagraph" color="black.500">
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
  currency: PropTypes.object,
};

const ClickableLabel = styled(Container)``;
ClickableLabel.defaultProps = {
  display: 'inline-block',
  borderBottom: '1px dashed',
  borderColor: 'black.400',
  fontSize: 'Paragraph',
  color: 'black.500',
  cursor: 'pointer',
  mb: 2,
};

/** Add missing fields to taxInfo and calculate tax amount */
const prepareTaxInfo = (userTaxInfo, amount, taxPercentage, hasForm) => {
  const taxAmount = Math.round(amount * (taxPercentage / 100));
  return {
    ...userTaxInfo,
    amount: taxAmount,
    percentage: taxPercentage,
    isReady: Boolean(!hasForm && (!amount || get(userTaxInfo, 'countryISO'))),
  };
};

const getTaxPerentageForProfile = (tierType, hostCountry, collectiveCountry, profile) => {
  const originCountry = getVatOriginCountry(tierType, hostCountry, collectiveCountry);
  return getVatPercentage(tierType, originCountry, get(profile, 'countryISO'), get(profile, 'number'));
};

/**
 * Breakdowns a total amount to show the user where the money goes.
 */
const StepBreakdown = ({
  amount,
  quantity,
  currency,
  platformFeePercent,
  hostFeePercent,
  paymentMethod,
  showFees,
  applyTaxes,
  userTaxInfo,
  onChange,
  tierType,
  hostCountry,
  collectiveCountry,
}) => {
  const [formState, setFormState] = useState({ isEnabled: false, error: false });
  const taxPercentage = getTaxPerentageForProfile(tierType, hostCountry, collectiveCountry, userTaxInfo);
  const taxInfo = prepareTaxInfo(userTaxInfo, amount, taxPercentage, formState.isEnabled);

  // Helper to prepare onChange data
  const dispatchChange = (newValues, hasFormParam) => {
    const newTaxInfo = { ...taxInfo, ...newValues };
    const percent = getTaxPerentageForProfile(tierType, hostCountry, collectiveCountry, newTaxInfo);
    const hasForm = hasFormParam === undefined ? formState.isEnabled : hasFormParam;
    return onChange && onChange(prepareTaxInfo(newTaxInfo, amount, percent, hasForm));
  };

  useEffect(() => {
    // Dispatch initial value on mount
    dispatchChange();

    // Resolve country from IP if none provided
    if (!get(userTaxInfo, 'countryISO')) {
      fetchGeoLocation().then(countryISO => {
        // Country may have been changed by the user by the time geolocation API respond
        if (!get(userTaxInfo, 'countryISO')) {
          dispatchChange({ countryISO });
        }
      });
    }
  }, []);

  const hasConfirmedTaxID = taxInfo.number && taxInfo.isReady;
  return (
    <StyledCard width={1} maxWidth={464} px={[24, 48]} py={24}>
      {showFees && (
        <FeesBreakdown
          platformFeePercent={platformFeePercent}
          hostFeePercent={hostFeePercent}
          paymentMethod={paymentMethod}
          currency={currency}
          amount={amount}
        />
      )}
      {quantity && (tierType === 'TICKET' || quantity > 1) && (
        <React.Fragment>
          <AmountLine my={3}>
            <Label fontWeight="bold">
              <FormattedMessage id="contribution.itemPrice" defaultMessage="Item price" />
            </Label>
            <Span fontSize="LeadParagraph">
              {amount ? (
                formatCurrency(amount / quantity, currency)
              ) : (
                <Span textTransform="uppercase">
                  <FormattedMessage id="amount.free" defaultMessage="free" />
                </Span>
              )}
            </Span>
          </AmountLine>
          <AmountLine my={3}>
            <Label fontWeight="bold">
              <FormattedMessage id="contribution.quantity" defaultMessage="Quantity" />
            </Label>
            <Span fontSize="LeadParagraph">{quantity}</Span>
          </AmountLine>
        </React.Fragment>
      )}
      <AmountLine my={3}>
        <Label fontWeight="bold">
          <FormattedMessage id="contribution.your" defaultMessage="Your contribution" />
        </Label>
        <Span fontSize="LeadParagraph">{formatCurrency(amount, currency)}</Span>
      </AmountLine>
      {applyTaxes && amount > 0 && (
        <React.Fragment>
          <AmountLine my={3}>
            <Flex flexDirection="column">
              <Container display="flex" alignItems="center">
                <Span fontSize="Paragraph" fontWeight="bold" mr={2}>
                  <FormattedMessage id="tax.vatShort" defaultMessage="VAT" />
                </Span>
                <InputTypeCountry
                  minWidth={250}
                  maxMenuHeight={100}
                  onChange={code => dispatchChange({ countryISO: code, number: null })}
                  value={taxInfo.countryISO}
                  error={!taxInfo.countryISO}
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
                          values={{ taxName: 'VAT' }}
                        />
                      </ClickableLabel>
                    </Flex>
                  ) : (
                    <ClickableLabel
                      onClick={() => {
                        setFormState({ isEnabled: true, error: false });
                        dispatchChange(null, true);
                      }}
                    >
                      <FormattedMessage
                        id="contribute.enterTaxNumber"
                        defaultMessage="Enter {taxName} number (if you have one)"
                        values={{ taxName: 'VAT' }}
                      />
                    </ClickableLabel>
                  )}
                  {formState.isEnabled && (
                    <Flex flexDirection="column" className="cf-tax-form">
                      <Container display="flex" ml={[-20, -26]} alignItems="center">
                        <Close
                          size={16}
                          color="grey"
                          cursor="pointer"
                          className="close"
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
                          maxWidth={180}
                          onChange={e => {
                            setFormState({ isEnabled: true, error: false });
                            dispatchChange({ number: e.target.value });
                          }}
                        />
                        <StyledButton
                          buttonSize="small"
                          disabled={!taxInfo.number || formState.error}
                          onClick={() => {
                            let error = false;
                            let validationResult = checkVATNumberFormat(taxInfo.number);
                            if (!validationResult.isValid) {
                              // Try again with the country code
                              validationResult = checkVATNumberFormat(`${taxInfo.countryISO}${taxInfo.number}`);
                              if (!validationResult.isValid) {
                                error = 'invalid';
                              }
                            } else if (get(validationResult, 'country.isoCode.short') !== taxInfo.countryISO) {
                              error = 'bad_country';
                            }

                            const number = !error ? validationResult.value : taxInfo.number;
                            const hasError = Boolean(error);
                            setFormState({ isEnabled: hasError, error: error });
                            dispatchChange({ number }, hasError);
                          }}
                        >
                          <FormattedMessage id="actions.done" defaultMessage="Done" />
                        </StyledButton>
                      </Container>
                      {formState.error === 'invalid' && (
                        <Span mt={1} fontSize="Caption" color="red.500">
                          <FormattedMessage
                            id="contribute.taxInfoInvalid"
                            defaultMessage="Invalid {taxName} number"
                            values={{ taxName: 'VAT' }}
                          />
                        </Span>
                      )}
                      {formState.error === 'bad_country' && (
                        <Span mt={1} fontSize="Caption" color="red.500">
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
            <Span fontSize="LeadParagraph" pt={2}>
              {taxInfo.isReady && `+ ${formatCurrency(taxInfo.amount, currency)}`}
            </Span>
          </AmountLine>
        </React.Fragment>
      )}
      <StyledHr my={3} />
      <AmountLine>
        <Label fontWeight="bold">
          <FormattedMessage id="contribution.total" defaultMessage="TOTAL" />
        </Label>
        <Span fontWeight="bold" fontSize="LeadParagraph" color={taxInfo.isReady ? 'black.800' : 'black.400'}>
          {formatCurrency(amount + (taxInfo.isReady ? taxInfo.amount : 0), currency)}
        </Span>
      </AmountLine>
    </StyledCard>
  );
};

StepBreakdown.propTypes = {
  /** The total amount without tax in cents */
  amount: PropTypes.number.isRequired,
  /** The currency used for the transaction */
  currency: PropTypes.string.isRequired,
  /** Number of items to order */
  quantity: PropTypes.number,
  /** Platform fee. Overriding this stands for test purposes only */
  platformFeePercent: PropTypes.number,
  /** Host fees, as an integer percentage */
  hostFeePercent: PropTypes.number,
  /** If we need to activate tax for this order */
  applyTaxes: PropTypes.bool,
  /** The tax identification information from user */
  userTaxInfo: PropTypes.shape({
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
  tierType: PropTypes.oneOf(tiersTypes),
  /** Country of the host. Used in tax calculation */
  hostCountry: propTypeCountry,
  /** Country of the collective. Used in tax calculation */
  collectiveCountry: propTypeCountry,
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
};

StepBreakdown.defaultProps = {
  platformFeePercent: 5,
  hostFeePercent: 0,
  showFees: true,
};

export default StepBreakdown;
