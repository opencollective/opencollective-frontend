import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import type { Currency } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import StyledButtonSet from '../StyledButtonSet';
import StyledCard from '../StyledCard';
import StyledInputAmount from '../StyledInputAmount';
import StyledCheckbox from '../StyledCheckbox';
import StyledLinkButton from '../StyledLinkButton';
import { P, Span } from '../Text';

import { WhyPlatformTipModal } from './WhyPlatformTipModal';

const I18nMessages = defineMessages({
  OTHER: {
    id: 'platformFee.Other',
    defaultMessage: 'Other',
  },
});

export const enum PlatformTipOption {
  NONE = 'NONE',
  TEN_PERCENT = 'TEN_PERCENT',
  FIFTEEN_PERCENT = 'FIFTEEN_PERCENT',
  TWENTY_PERCENT = 'TWENTY_PERCENT',
  THIRTY_PERCENT = 'THIRTY_PERCENT',
  OTHER = 'OTHER',
}

// Percentage-based options for contributions >= $20 (2000 cents)
const PERCENTAGE_OPTIONS: TipPreset[] = [
  { key: PlatformTipOption.TEN_PERCENT, percent: 0.1 },
  { key: PlatformTipOption.FIFTEEN_PERCENT, percent: 0.15 },
  { key: PlatformTipOption.TWENTY_PERCENT, percent: 0.2 },
];

type TipPreset = {
  key: PlatformTipOption;
  percent?: number;
  fixedValue?: number;
};

// For small contributions (< $20), show friendly fixed dollar presets.
function getDollarPresets(amountInCents: number): TipPreset[] {
  const amountDollars = amountInCents / 100;
  let values: number[];

  if (amountDollars <= 10) {
    values = [100, 200, 300]; // $1, $2, $3
  } else {
    values = [200, 300, 500]; // $2, $3, $5
  }

  return [
    { key: PlatformTipOption.TEN_PERCENT, fixedValue: values[0] },
    { key: PlatformTipOption.FIFTEEN_PERCENT, fixedValue: values[1] },
    { key: PlatformTipOption.TWENTY_PERCENT, fixedValue: values[2] },
  ];
}

// Threshold below which we show dollar amounts instead of percentages (2000 cents = $20)
const DOLLAR_PRESET_THRESHOLD = 2000;

type PlatformTipContainerProps = {
  value: number;
  selectedOption: PlatformTipOption;
  amount: number;
  currency: string;
  step: string;
  collectiveName: string;
  onChange: (selectedOption: PlatformTipOption, value?: number) => void;
};

export function PlatformTipContainer(props: PlatformTipContainerProps) {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const isCompact = props.step !== 'details' && !isEditing;

  const usesDollarPresets = props.amount > 0 && props.amount < DOLLAR_PRESET_THRESHOLD;
  const presets = React.useMemo(
    () => (usesDollarPresets ? getDollarPresets(props.amount) : PERCENTAGE_OPTIONS),
    [usesDollarPresets, props.amount],
  );

  const getTipValueForOption = React.useCallback(
    (optionKey: PlatformTipOption): number => {
      if (optionKey === PlatformTipOption.NONE) {
        return 0;
      }
      const preset = presets.find(p => p.key === optionKey);
      if (preset) {
        return preset.fixedValue ?? Math.round((preset.percent ?? 0.15) * props.amount);
      }
      return Math.round(0.15 * props.amount);
    },
    [presets, props.amount],
  );

  const onOptionChange = React.useCallback(
    (option: PlatformTipOption) => {
      if (props.selectedOption === option) {
        return;
      }
      props.onChange(option, getTipValueForOption(option));
    },
    [props.onChange, props.selectedOption, getTipValueForOption],
  );

  const onOtherChange = React.useCallback(
    (value: number) => {
      props.onChange(PlatformTipOption.OTHER, value);
    },
    [props.onChange],
  );

  // Recalculate tip when contribution amount changes (except for custom/none)
  React.useEffect(() => {
    if (props.selectedOption === PlatformTipOption.OTHER || props.selectedOption === PlatformTipOption.NONE) {
      return;
    }
    props.onChange(props.selectedOption, getTipValueForOption(props.selectedOption));
  }, [props.amount]);

  if (props.amount === 0) {
    return null;
  }

  const tipAmount = formatCurrency(props.value, props.currency as Currency, { locale: intl.locale });
  const percentage =
    props.value && props.amount && props.amount > 0 ? ((props.value / props.amount) * 100).toFixed(0) : '0';

  // Build StyledButtonSet items: [presetKeys..., OTHER]
  const buttonItems = [...presets.map(p => p.key), PlatformTipOption.OTHER];

  const getButtonLabel = (item: PlatformTipOption, isSelected: boolean) => {
    const fontSize = isSelected ? '15px' : '14px';
    const fontWeight = isSelected ? 500 : 400;
    if (item === PlatformTipOption.OTHER) {
      return (
        <Span fontSize={fontSize} lineHeight="22px" fontWeight={fontWeight}>
          {intl.formatMessage(I18nMessages.OTHER)}
        </Span>
      );
    }
    const preset = presets.find(p => p.key === item);
    if (!preset) {
      return null;
    }
    if (preset.fixedValue != null) {
      const dollars = preset.fixedValue / 100;
      const label = dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
      return (
        <Span fontSize={fontSize} lineHeight="22px" fontWeight={fontWeight}>
          {label}
        </Span>
      );
    }
    return (
      <Span fontSize={fontSize} lineHeight="22px" fontWeight={fontWeight}>
        {`${(preset.percent ?? 0) * 100}%`}
      </Span>
    );
  };

  // Compact view: just acknowledge the tip with an Edit link
  if (isCompact) {
    return (
      <StyledCard mt={3} p={[12, 24]} mx={[16, 'none']} borderRadius={15} bg="#F9FAFB" data-cy="platform-tip-container">
        <Flex justifyContent="space-between" alignItems="center">
          <P fontSize="13px" lineHeight="18px" color="black.700">
            {props.selectedOption === PlatformTipOption.NONE ? (
              <FormattedMessage
                defaultMessage="No contribution to the platform"
                id="platformTip.noTip"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Optional contribution to the platform: <bold>{amount}</bold>"
                id="platformTip.compactSummary"
                values={{ amount: tipAmount, bold: chunks => <strong>{chunks}</strong> }}
              />
            )}
          </P>
          <StyledLinkButton fontSize="13px" onClick={() => setIsEditing(true)}>
            <FormattedMessage id="Edit" defaultMessage="Edit" />
          </StyledLinkButton>
        </Flex>
      </StyledCard>
    );
  }

  return (
    <React.Fragment>
      <StyledCard mt={3} p={[12, 24]} mx={[16, 'none']} borderRadius={15} bg="#F9FAFB" data-cy="platform-tip-container">
        {/* Description */}
        <P fontSize="13px" lineHeight="18px" color="black.700" mb={2}>
          <FormattedMessage
            defaultMessage="Help us keep the Open Collective platform sustainable."
            id="platformTip.helperText"
          />
          {' '}
          <StyledLinkButton fontSize="13px" onClick={() => setIsModalOpen(true)}>
            <FormattedMessage defaultMessage="Learn more" id="TdTXXf" />
          </StyledLinkButton>
        </P>
        <P fontSize="13px" lineHeight="18px" color="black.700" mb={2}>
          <FormattedMessage
            defaultMessage="Optional contribution: <bold>{amount}</bold>"
            id="platformTip.currentAmount"
            values={{ amount: tipAmount, bold: chunks => <strong>{chunks}</strong> }}
          />
        </P>

        {/* Tip selector — matches amount picker style */}
        <Flex width="100%">
          <StyledButtonSet
            data-cy="platform-tip-options"
            role="group"
            aria-label="Platform tip amount"
            width="100%"
            justifyContent="center"
            items={buttonItems}
            selected={props.selectedOption}
            buttonProps={{ px: 2, py: '4px' }}
            size="small"
            onChange={value => {
              if (value === PlatformTipOption.OTHER) {
                if (props.selectedOption !== PlatformTipOption.OTHER) {
                  props.onChange(PlatformTipOption.OTHER, getTipValueForOption(PlatformTipOption.FIFTEEN_PERCENT));
                }
              } else {
                onOptionChange(value as PlatformTipOption);
              }
            }}
          >
            {({ item, isSelected }) => getButtonLabel(item as PlatformTipOption, isSelected)}
          </StyledButtonSet>
        </Flex>

        {/* Custom amount input — same layout as main contribution Other input */}
        {props.selectedOption === PlatformTipOption.OTHER && (
          <Flex justifyContent="space-between" alignItems="center" mt={2}>
            <StyledInputAmount
              id="feesOnTop"
              name="platformTip"
              data-cy="platform-tip-other-amount"
              disabled={!props.amount}
              currency={props.currency}
              currencyDisplay="full"
              onChange={onOtherChange}
              value={props.value}
              width={1}
              fontSize="14px"
            />
          </Flex>
        )}

        {/* Opt-out checkbox */}
        <Box mt={3}>
          <StyledCheckbox
            name="platform-tip-opt-out"
            checked={props.selectedOption === PlatformTipOption.NONE}
            onChange={({ checked }) =>
              checked
                ? props.onChange(PlatformTipOption.NONE, 0)
                : props.onChange(PlatformTipOption.FIFTEEN_PERCENT, Math.round(0.15 * props.amount))
            }
            label={
              <Span fontSize="13px" color="black.700">
                <FormattedMessage
                  defaultMessage="I don't want to support the Open Collective platform"
                  id="platformTip.optOut"
                />
              </Span>
            }
            data-cy="platform-tip-none"
          />
          {props.selectedOption === PlatformTipOption.NONE && (
            <P fontSize="12px" lineHeight="16px" color="black.500" mt={2} ml="26px">
              <FormattedMessage
                defaultMessage="No worries, we're grateful you're supporting {collectiveName}. If you change your mind, every bit helps our small team keep the platform running. 💙"
                id="platformTip.optOutNudge"
                values={{ collectiveName: props.collectiveName }}
              />
            </P>
          )}
        </Box>
      </StyledCard>

      {isModalOpen && <WhyPlatformTipModal onClose={() => setIsModalOpen(false)} />}
    </React.Fragment>
  );
}
