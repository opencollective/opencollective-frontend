import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';

import { Close } from 'styled-icons/material/Close';

import { formatCurrency, capitalize } from '../lib/utils';
import getPaymentMethodFees from '../lib/fees';
import fetchGeoLocation from '../lib/geolocation_api';
import StyledCard from './StyledCard';
import { Span } from './Text';
import StyledHr from './StyledHr';
import ExternalLinkNewTab from './ExternalLinkNewTab';
import InputTypeCountry from './InputTypeCountry';
import Container from './Container';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';

const AmountLine = styled(Flex)``;
AmountLine.defaultProps = {
  justifyContent: 'space-between',
  my: 2,
  flexWrap: 'wrap',
};

const Label = styled(Span)`
  min-width: 210px;
`;
Label.defaultProps = {
  fontSize: 'Paragraph',
  mr: 1,
};

/** Returns tax amount */
const calculateTaxAmount = (amount, tax) => {
  if (!tax || !tax.percentage) {
    return 0;
  }

  return Math.round(amount * (tax.percentage / 100));
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
            <FormattedMessage id="contribution.platformFeePercent" defaultMessage="Platform fee" />
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
              <ExternalLinkNewTab href={pmFeeInfo.aboutURL}>{capitalize(paymentMethod.service)}</ExternalLinkNewTab>
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

const validatetaxInfoNumber = (input, identificationNumberRegex) => {
  try {
    return RegExp(identificationNumberRegex).test(input);
  } catch {
    // Host regex may be invalid, we don't want to crash all collectives orders if that's
    // the case but we should definitely log the error to be able to fix the regex.
    console.error(`Regexp crashed on "${input}": ${identificationNumberRegex}`);
  }
  return false;
};

const isTaxedCountry = (tax, countryISO) => {
  return !countryISO || !tax.countries || tax.countries.includes(countryISO);
};

const getInitialState = (collectiveTaxInfo, tax) => {
  const base = {
    countryISO: null,
    number: null,
    isReady: Boolean(tax ? collectiveTaxInfo && collectiveTaxInfo.countryISO : true),
    amount: 0,
  };
  return { ...base, ...collectiveTaxInfo };
};

/** Add missing fields to taxInfo and calculate tax amount */
const prepareTaxInfo = (baseAmount, tax, collectiveTaxInfo) => {
  const taxInfo = getInitialState(collectiveTaxInfo, tax);
  const hasConfirmedTaxID = taxInfo.number && taxInfo.isReady;
  const isTaxApplicable = tax && isTaxedCountry(tax, taxInfo.countryISO) && !hasConfirmedTaxID;
  const amount = isTaxApplicable ? calculateTaxAmount(baseAmount, tax) : 0;
  return { ...taxInfo, amount };
};

/**
 * Breakdowns a total amount to show the user where the money goes.
 */
const ContributionBreakdown = ({
  amount,
  currency,
  tax,
  platformFeePercent,
  hostFeePercent,
  paymentMethod,
  showFees,
  collectiveTaxInfo,
  onChange,
}) => {
  const [formState, setFormState] = useState({ isEnabled: false, error: false });
  const taxInfo = prepareTaxInfo(amount, tax, collectiveTaxInfo);
  const dispatchChange = newValues => onChange(prepareTaxInfo(amount, tax, { ...taxInfo, ...newValues }));

  useEffect(() => {
    // Dispatch initial value on mount
    onChange(taxInfo);

    // Resolve country from IP if none provided
    if (tax && !collectiveTaxInfo.countryISO) {
      fetchGeoLocation().then(countryISO => {
        // User country may have changed
        if (!collectiveTaxInfo.countryISO && countryISO) {
          dispatchChange({ countryISO, isReady: !formState.isEnabled });
        }
      });
    }
  }, []);

  const hasConfirmedTaxID = taxInfo.number && taxInfo.isReady;
  const countryHasTax = tax && isTaxedCountry(tax, taxInfo.countryISO);
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
      <AmountLine my={3}>
        <Label fontWeight="bold">
          <FormattedMessage id="contribution.your" defaultMessage="Your contribution" />
        </Label>
        <Span fontSize="LeadParagraph">{formatCurrency(amount, currency)}</Span>
      </AmountLine>
      {Boolean(tax) && (
        <React.Fragment>
          <AmountLine my={3}>
            <Flex flexDirection="column">
              <Container display="flex" alignItems="center">
                <Span fontSize="Paragraph" fontWeight="bold" mr={1}>
                  {tax.name}
                </Span>
                <InputTypeCountry
                  mode="underlined"
                  value={taxInfo.countryISO}
                  onChange={({ code }) => dispatchChange({ countryISO: code, isReady: !formState.isEnabled })}
                  labelBuilder={({ code, name }) => {
                    return `${name} (+${tax.countries && !tax.countries.includes(code) ? 0 : tax.percentage}%)`;
                  }}
                />
              </Container>
              {taxInfo.countryISO && countryHasTax && (
                <Box mt={2}>
                  {hasConfirmedTaxID && !formState.isEnabled ? (
                    <Flex>
                      <Span mr={3}>{taxInfo.number}</Span>
                      <ClickableLabel
                        onClick={() => {
                          setFormState({ isEnabled: true, error: false });
                          dispatchChange({ isReady: false });
                        }}
                      >
                        <FormattedMessage
                          id="contribute.changeTaxNumber"
                          defaultMessage="Change {taxName} number"
                          values={{ taxName: tax.name }}
                        />
                      </ClickableLabel>
                    </Flex>
                  ) : (
                    <ClickableLabel
                      onClick={() => {
                        setFormState({ isEnabled: true, error: false });
                        dispatchChange({ isReady: false });
                      }}
                    >
                      <FormattedMessage
                        id="contribute.enterTaxNumber"
                        defaultMessage="Enter {taxName} number"
                        values={{ taxName: tax.name }}
                      />
                    </ClickableLabel>
                  )}
                  {formState.isEnabled && (
                    <Flex flexDirection="column">
                      <Container display="flex" ml={[-20, -26]} alignItems="center">
                        <Close
                          size={16}
                          color="grey"
                          cursor="pointer"
                          onClick={() => {
                            setFormState({ isEnabled: false, error: false });
                            dispatchChange({ number: null, isReady: true });
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
                            dispatchChange({ number: e.target.value, isReady: false });
                          }}
                          onBlur={() => {
                            if (
                              formState.isEnabled &&
                              !validatetaxInfoNumber(taxInfo.number, tax.identificationNumberRegex)
                            ) {
                              setFormState({ isEnabled: true, error: true });
                            } else {
                              setFormState({ isEnabled: true, error: false });
                            }
                          }}
                        />
                        <StyledButton
                          buttonSize="small"
                          disabled={!taxInfo.number || formState.error}
                          onClick={() => {
                            const isValid = validatetaxInfoNumber(taxInfo.number, tax.identificationNumberRegex);
                            setFormState({ isEnabled: !isValid, error: !isValid });
                            dispatchChange({ isReady: isValid });
                          }}
                        >
                          <FormattedMessage id="contribute.taxNumberBtn" defaultMessage="Done" />
                        </StyledButton>
                      </Container>
                      {formState.error && (
                        <Span mt={1} fontSize="Caption" color="red.500">
                          <FormattedMessage
                            id="contribute.taxInfoInvalid"
                            defaultMessage="Invalid {taxName} number"
                            values={{ taxName: tax.name }}
                          />
                        </Span>
                      )}
                    </Flex>
                  )}
                </Box>
              )}
            </Flex>
            <Span fontSize="LeadParagraph">{taxInfo.isReady && `+ ${formatCurrency(taxInfo.amount, currency)}`}</Span>
          </AmountLine>
          <StyledHr my={3} />
          <AmountLine>
            <Label fontWeight="bold">
              <FormattedMessage id="contribution.total" defaultMessage="TOTAL" />
            </Label>
            <Span fontWeight="bold" fontSize="LeadParagraph" color={taxInfo.isReady ? 'black.800' : 'black.400'}>
              {formatCurrency(amount + (taxInfo.isReady ? taxInfo.amount : 0), currency)}
            </Span>
          </AmountLine>
        </React.Fragment>
      )}
    </StyledCard>
  );
};

ContributionBreakdown.propTypes = {
  /** The total amount without tax in cents */
  amount: PropTypes.number.isRequired,
  /** The currency used for the transaction */
  currency: PropTypes.string.isRequired,
  /** Platform fee. Overriding this stands for test purposes only */
  platformFeePercent: PropTypes.number,
  /** Host fees, as an integer percentage */
  hostFeePercent: PropTypes.number,
  /** Tax as defined in host settings */
  tax: PropTypes.shape({
    /** Tax value, as an integer percentage */
    percentage: PropTypes.number,
    /** Tax name, only required if a tax is applied */
    name: PropTypes.string,
    /** A list of countries where the tax applies. If not set, tax will apply on all countries. */
    countries: PropTypes.arrayOf(PropTypes.string),
    /** An optionnal regex used to validate the tax identification number */
    identificationNumberRegex: PropTypes.string,
  }),
  /** The tax identification information from user */
  collectiveTaxInfo: PropTypes.shape({
    /** Country ISO of the contributing profile. Used to see what taxes applies */
    countryISO: PropTypes.string,
    /** The tax identification numer */
    number: PropTypes.string,
    /** A flag to indicate if the form is ready to be submitted */
    isReady: PropTypes.bool,
    /** The tax amount in cents */
    amount: PropTypes.numer,
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
  onChange: PropTypes.func,
};

ContributionBreakdown.defaultProps = {
  platformFeePercent: 5,
  hostFeePercent: 0,
  showFees: true,
};

export default ContributionBreakdown;
