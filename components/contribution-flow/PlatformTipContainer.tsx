import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  percent: number;
};


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

  // Reset editing state when navigating back to details step
  React.useEffect(() => {
    if (props.step === 'details') {
      setIsEditing(false);
    }
  }, [props.step]);

  const isCompact = props.step !== 'details' && !isEditing;

  const presets = PERCENTAGE_OPTIONS;

  const getTipValueForOption = React.useCallback(
    (optionKey: PlatformTipOption): number => {
      if (optionKey === PlatformTipOption.NONE) {
        return 0;
      }
      const preset = presets.find(p => p.key === optionKey);
      return preset ? Math.round(preset.percent * props.amount) : Math.round(0.15 * props.amount);
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
  }, [props.amount, getTipValueForOption]);

  if (props.amount === 0) {
    return null;
  }

  const tipAmount = formatCurrency(props.value, props.currency as Currency, { locale: intl.locale });

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
    return (
      <Span fontSize={fontSize} lineHeight="22px" fontWeight={fontWeight}>
        {`${preset.percent * 100}%`}
      </Span>
    );
  };

  // Compact view: just acknowledge the tip with an Edit link
  if (isCompact) {
    return (
      <StyledCard mt={3} p={[12, 24]} mx={[16, 'none']} borderRadius={15} bg="#F9FAFB" data-cy="platform-tip-container">
        <Flex justifyContent="space-between" alignItems="center">
          <P fontSize="13px" lineHeight="18px" color="black.700">
            <FormattedMessage
              defaultMessage="Voluntary contribution to the platform: <bold>{amount}</bold>"
              id="platformTip.compactSummary"
              values={{ amount: tipAmount, bold: chunks => <strong>{chunks}</strong> }}
            />
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
        {/* Title */}
        <P fontSize="13px" lineHeight="18px" color="black.700" fontWeight="500" mb={1}>
          <FormattedMessage
            defaultMessage="Help us keep the Open Collective platform sustainable"
            id="platformTip.modalTitle"
          />
        </P>

        {/* Social proof + learn more */}
        <P fontSize="13px" lineHeight="18px" color="black.700" mb={2}>
          <FormattedMessage
            defaultMessage="One in two contributors adds a voluntary contribution averaging 15%. Together, these contributions cover 25% of our operating costs and help keep the platform running for everyone. <link>Learn more</link>"
            id="platformTip.socialProof"
            values={{
              link: chunks => (
                <StyledLinkButton fontSize="13px" onClick={() => setIsModalOpen(true)}>
                  {chunks}
                </StyledLinkButton>
              ),
            }}
          />
        </P>
        <P fontSize="13px" lineHeight="18px" color="black.700" mb={2}>
          <FormattedMessage
            defaultMessage="Voluntary contribution: <bold>{amount}</bold>"
            id="platformTip.currentAmount"
            values={{ amount: tipAmount, bold: chunks => <strong>{chunks}</strong> }}
          />
        </P>

        {/* Tip selector */}
        <Flex width="100%">
          <StyledButtonSet
            data-cy="platform-tip-options"
            role="group"
            aria-label="Platform contribution amount"
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

        {/* Custom amount input */}
        {(props.selectedOption === PlatformTipOption.OTHER || props.selectedOption === PlatformTipOption.NONE) && (
          <Flex justifyContent="space-between" alignItems="center" mt={2}>
            <StyledInputAmount
              id="feesOnTop"
              name="platformTip"
              aria-label="Custom platform contribution amount"
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
            checked={props.selectedOption === PlatformTipOption.NONE || (props.selectedOption === PlatformTipOption.OTHER && props.value === 0)}
            onChange={({ checked }) =>
              checked
                ? props.onChange(PlatformTipOption.OTHER, 0)
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
          <AnimatePresence>
            {(props.selectedOption === PlatformTipOption.NONE || (props.selectedOption === PlatformTipOption.OTHER && props.value === 0)) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <P fontSize="12px" lineHeight="16px" color="black.500" mt={2} ml="26px">
                  <FormattedMessage
                    defaultMessage="No worries, we're grateful you're supporting {collectiveName}. If you change your mind, every bit helps our small team keep the platform running. 💙"
                    id="platformTip.optOutNudge"
                    values={{ collectiveName: props.collectiveName }}
                  />
                </P>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </StyledCard>

      {isModalOpen && <WhyPlatformTipModal onClose={() => setIsModalOpen(false)} />}
    </React.Fragment>
  );
}
