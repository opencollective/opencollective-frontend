import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency, roundCentsAmount } from '../../lib/currency-utils';
import type { Currency } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import InputAmount from '../InputAmount';
import StyledButtonSet from '../StyledButtonSet';
import StyledCard from '../StyledCard';
import StyledCheckbox from '../StyledCheckbox';
import StyledLinkButton from '../StyledLinkButton';
import { P, Span } from '../Text';

import { DEFAULT_PLATFORM_TIP_PERCENTAGE } from './constants';
import { PlatformTipOption } from './PlatformTipContainer';
import { WhyPlatformTipModal } from './WhyPlatformTipModal';

const I18nMessages = defineMessages({
  CUSTOM: {
    id: 'Sjo1P4',
    defaultMessage: 'Custom',
  },
});

type TipPreset = {
  key: PlatformTipOption;
  percent: number;
};

const PERCENTAGE_OPTIONS: TipPreset[] = [
  { key: PlatformTipOption.TEN_PERCENT, percent: 0.1 },
  { key: PlatformTipOption.FIFTEEN_PERCENT, percent: 0.15 },
  { key: PlatformTipOption.TWENTY_PERCENT, percent: 0.2 },
];

type NewPlatformTipContainerProps = {
  value: number;
  selectedOption: PlatformTipOption;
  amount: number;
  currency: string;
  step: string;
  collectiveName: string;
  onChange: (selectedOption: PlatformTipOption, value?: number) => void;
};

type NewPlatformTipSelectorProps = Omit<NewPlatformTipContainerProps, 'step'>;

export function NewPlatformTipSelector(
  props: NewPlatformTipSelectorProps & { showHeader?: boolean; showOptOut?: boolean },
) {
  const {
    amount,
    collectiveName,
    currency,
    onChange,
    selectedOption,
    showHeader = true,
    showOptOut = true,
    value,
  } = props;
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const presets = PERCENTAGE_OPTIONS;

  const getTipValueForOption = React.useCallback(
    (optionKey: PlatformTipOption): number => {
      if (optionKey === PlatformTipOption.NONE) {
        return 0;
      }
      const preset = presets.find(p => p.key === optionKey);
      const percent = preset ? preset.percent : DEFAULT_PLATFORM_TIP_PERCENTAGE;
      return roundCentsAmount(percent * amount, currency);
    },
    [presets, amount, currency],
  );

  const onOptionChange = React.useCallback(
    (option: PlatformTipOption) => {
      if (selectedOption === option) {
        return;
      }
      onChange(option, getTipValueForOption(option));
    },
    [onChange, selectedOption, getTipValueForOption],
  );

  const onOtherChange = React.useCallback(
    (newValue: number) => {
      onChange(PlatformTipOption.OTHER, newValue);
    },
    [onChange],
  );

  React.useEffect(() => {
    if (selectedOption === PlatformTipOption.OTHER || selectedOption === PlatformTipOption.NONE) {
      return;
    }
    const nextValue = getTipValueForOption(selectedOption);
    if (nextValue !== value) {
      onChange(selectedOption, nextValue);
    }
  }, [amount, getTipValueForOption, onChange, selectedOption, value]);

  if (amount === 0) {
    return null;
  }

  const tipAmount = formatCurrency(value, currency as Currency, { locale: intl.locale });

  const buttonItems = [...presets.map(p => p.key), PlatformTipOption.OTHER];

  const getButtonLabel = (item: PlatformTipOption, isSelected: boolean) => {
    const fontSize = isSelected ? '15px' : '14px';
    const fontWeight = isSelected ? 500 : 400;
    if (item === PlatformTipOption.OTHER) {
      return (
        <Span fontSize={fontSize} lineHeight="22px" fontWeight={fontWeight}>
          {intl.formatMessage(I18nMessages.CUSTOM)}
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

  return (
    <React.Fragment>
      <Box data-cy="platform-tip-selector">
        {showHeader && (
          <React.Fragment>
            <P fontSize="16px" lineHeight="20px" color="black.700" fontWeight="500" mb={2}>
              <FormattedMessage
                defaultMessage="Help sustain the Open Collective platform"
                id="platformTip.modalTitle"
              />
            </P>

            <P fontSize="14px" lineHeight="20px" color="black.700" mb={2}>
              <FormattedMessage
                defaultMessage="Most contributors add a voluntary contribution. On average, they add 15%, and together these contributions cover 25% of the operating costs. <link>Why?</link>"
                id="platformTip.socialProof"
                values={{
                  link: chunks => (
                    <StyledLinkButton fontSize="14px" onClick={() => setIsModalOpen(true)}>
                      {chunks}
                    </StyledLinkButton>
                  ),
                }}
              />
            </P>
          </React.Fragment>
        )}
        <P fontSize="14px" lineHeight="20px" color="black.700" mb={2}>
          <FormattedMessage
            defaultMessage="Contribution to the Platform: <bold>{amount}</bold>"
            id="platformTip.currentAmount"
            values={{ amount: tipAmount, bold: chunks => <strong>{chunks}</strong> }}
          />
        </P>

        <Flex width="100%">
          <StyledButtonSet
            data-cy="platform-tip-options"
            role="group"
            aria-label="Contribution to the Platform amount"
            width="100%"
            justifyContent="center"
            items={buttonItems}
            selected={selectedOption}
            buttonProps={{ px: 2, py: '4px' }}
            size="small"
            onChange={value => {
              if (value === PlatformTipOption.OTHER) {
                if (selectedOption !== PlatformTipOption.OTHER) {
                  onChange(PlatformTipOption.OTHER, getTipValueForOption(PlatformTipOption.FIFTEEN_PERCENT));
                }
              } else {
                onOptionChange(value as PlatformTipOption);
              }
            }}
          >
            {({ item, isSelected }) => getButtonLabel(item as PlatformTipOption, isSelected)}
          </StyledButtonSet>
        </Flex>

        {(selectedOption === PlatformTipOption.OTHER || selectedOption === PlatformTipOption.NONE) && (
          <Flex justifyContent="space-between" alignItems="center" mt={2}>
            <InputAmount
              id="feesOnTop"
              name="platformTip"
              aria-label="Custom platform contribution amount"
              data-cy="platform-tip-other-amount"
              disabled={!amount}
              currency={currency}
              currencyDisplay="full"
              onChange={onOtherChange}
              value={value}
              className="w-full text-sm"
            />
          </Flex>
        )}

        {showOptOut && (
          <Box mt={3}>
            <StyledCheckbox
              name="platform-tip-opt-out"
              checked={
                selectedOption === PlatformTipOption.NONE || (selectedOption === PlatformTipOption.OTHER && value === 0)
              }
              onChange={({ checked }) =>
                checked
                  ? onChange(PlatformTipOption.OTHER, 0)
                  : onChange(
                      PlatformTipOption.FIFTEEN_PERCENT,
                      roundCentsAmount(DEFAULT_PLATFORM_TIP_PERCENTAGE * amount, currency),
                    )
              }
              label={
                <Span fontSize="14px" lineHeight="20px" color="black.700">
                  <FormattedMessage
                    defaultMessage="I don't want to add a contribution to the Open Collective platform"
                    id="platformTip.optOut"
                  />
                </Span>
              }
              data-cy="platform-tip-none"
            />
            <AnimatePresence>
              {(selectedOption === PlatformTipOption.NONE ||
                (selectedOption === PlatformTipOption.OTHER && value === 0)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <P fontSize="13px" lineHeight="18px" color="black.700" mt={2} ml="26px">
                    <FormattedMessage
                      defaultMessage="No worries, we're grateful you're supporting {collectiveName}. If you change your mind, every bit helps our small team keep the platform running. 💙"
                      id="platformTip.optOutNudge"
                      values={{ collectiveName }}
                    />
                  </P>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        )}
      </Box>

      {isModalOpen && <WhyPlatformTipModal onClose={() => setIsModalOpen(false)} />}
    </React.Fragment>
  );
}

export function NewPlatformTipContainer(props: NewPlatformTipContainerProps) {
  const { step } = props;
  const intl = useIntl();
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (step === 'details') {
      setIsEditing(false);
    }
  }, [step]);

  if (step !== 'details' && !isEditing) {
    const tipAmount = formatCurrency(props.value ?? 0, props.currency as Currency, { locale: intl.locale });

    return (
      <StyledCard mt={3} p={[16, 32]} mx={[16, 'none']} borderRadius={15} bg="#F9FAFB" data-cy="platform-tip-container">
        <Flex justifyContent="space-between" alignItems="center">
          <P fontSize="14px" lineHeight="20px" color="black.700">
            <FormattedMessage
              defaultMessage="Contribution to the Platform: <bold>{amount}</bold>"
              id="platformTip.currentAmount"
              values={{ amount: tipAmount, bold: chunks => <strong>{chunks}</strong> }}
            />
          </P>
          <StyledLinkButton fontSize="14px" onClick={() => setIsEditing(true)}>
            <FormattedMessage id="Edit" defaultMessage="Edit" />
          </StyledLinkButton>
        </Flex>
      </StyledCard>
    );
  }

  return (
    <StyledCard mt={3} p={[16, 32]} mx={[16, 'none']} borderRadius={15} bg="#F9FAFB">
      <NewPlatformTipSelector {...props} />
    </StyledCard>
  );
}
