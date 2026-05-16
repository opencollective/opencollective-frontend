import React from 'react';
import { clsx } from 'clsx';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency, roundCentsAmount } from '../../lib/currency-utils';
import type { Currency } from '../../lib/graphql/types/v2/graphql';
import theme from '../../lib/theme';

import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import Image from '../Image';
import StyledButtonSet from '../StyledButtonSet';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputAmount from '../StyledInputAmount';
import StyledLinkButton from '../StyledLinkButton';
import { P } from '../Text';

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

type PlatformTipInputProps = {
  value: number;
  selectedOption: PlatformTipOption;
  amount: number;
  currency: string;
  onChange: (selectedOption: PlatformTipOption, value?: number) => void;
  disabled: boolean;
};

function PlatformTipInput(props: PlatformTipInputProps) {
  const { amount, currency, disabled, onChange, selectedOption, value } = props;
  const intl = useIntl();

  const options = React.useMemo(
    () => ({
      [PlatformTipOption.NONE]: {
        label: '0%',
        percent: 0,
      },
      [PlatformTipOption.TEN_PERCENT]: {
        label: '10%',
        percent: 0.1,
      },
      [PlatformTipOption.FIFTEEN_PERCENT]: {
        label: '15%',
        percent: 0.15,
      },
      [PlatformTipOption.TWENTY_PERCENT]: {
        label: '20%',
        percent: 0.2,
      },
      [PlatformTipOption.THIRTY_PERCENT]: {
        label: '30%',
        percent: 0.3,
      },
      [PlatformTipOption.OTHER]: {
        label: intl.formatMessage(I18nMessages.OTHER),
        percent: 0.15,
      },
    }),
    [intl],
  );

  const onOptionChange = React.useCallback(
    (newSelectedOption: PlatformTipOption) => {
      if (selectedOption === newSelectedOption) {
        return;
      }

      onChange(newSelectedOption, roundCentsAmount(options[newSelectedOption].percent * amount, currency));
    },
    [amount, currency, onChange, options, selectedOption],
  );

  const onOtherChange = React.useCallback(
    value => {
      onChange(selectedOption, value);
    },
    [onChange, selectedOption],
  );

  React.useEffect(() => {
    const newTipAmount =
      selectedOption === PlatformTipOption.OTHER
        ? value
        : roundCentsAmount(options[selectedOption].percent * amount, currency);

    if (newTipAmount !== value) {
      onChange(selectedOption, newTipAmount);
    }
  }, [amount, currency, onChange, options, selectedOption, value]);

  return (
    <Box data-cy="platform-tip-input">
      <StyledButtonSet
        data-cy="platform-tip-options"
        flexDirection={['column', 'row']}
        disabled={disabled}
        items={[
          PlatformTipOption.TEN_PERCENT,
          PlatformTipOption.FIFTEEN_PERCENT,
          PlatformTipOption.TWENTY_PERCENT,
          PlatformTipOption.THIRTY_PERCENT,
          PlatformTipOption.OTHER,
        ]}
        selected={selectedOption}
        onChange={onOptionChange}
      >
        {({ item }) => options[item as number].label}
      </StyledButtonSet>
      {selectedOption === PlatformTipOption.OTHER && (
        <Flex mt={3} justifyContent="flex-end">
          <StyledInputAmount
            id="feesOnTop"
            name="platformTip"
            data-cy="platform-tip-other-amount"
            disabled={disabled}
            currency={currency}
            onChange={onOtherChange}
            value={value}
          />
        </Flex>
      )}
    </Box>
  );
}

type PlatformTipContainerProps = {
  value: number;
  selectedOption: PlatformTipOption;
  amount: number;
  currency: string;
  onChange: (selectedOption: PlatformTipOption, value?: number) => void;
  step: string;
};

export function PlatformTipContainer(props: PlatformTipContainerProps) {
  const intl = useIntl();
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  React.useEffect(() => {
    setIsCollapsed(true);
  }, [props.step]);

  const percentage = props.value && props.amount && props.amount > 0 ? props.value / props.amount : 0;

  const message = React.useMemo(() => {
    if (percentage <= 0) {
      return (
        <FormattedMessage
          defaultMessage="You can still support us by spreading the word and keeping in touch with us 💙"
          id="E/OCaw"
        />
      );
    }

    const tipEmoji = percentage >= 0.2 ? '😍' : percentage >= 0.15 ? '😀' : '🙂';

    return (
      <FormattedMessage
        defaultMessage="Thank you for your contribution! <Emoji></Emoji>"
        id="C8NetX"
        values={{ Emoji: () => <span className="mx-2">{tipEmoji}</span> }}
      />
    );
  }, [percentage]);

  const [isWhyPlatformTipModalOpen, setIsWhyPlatformTipModalOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Box
        mt={3}
        p={[16, 32]}
        mx={[16, 'none']}
        style={{ borderRadius: '15px' }}
        backgroundColor={theme.colors.black[50]}
        data-cy="platform-tip-container"
        display={props.amount === 0 ? 'none' : 'block'}
      >
        <Flex alignItems="center" gap={10}>
          <Image alt="Platform Tip" src="/static/images/platform-tip-jar.png" height={64} width={64} />
          <Box flexGrow={1} fontWeight="500" fontSize="20px">
            <FormattedMessage defaultMessage="Help us keep Open Collective sustainable" id="15EPUo" />
          </Box>
        </Flex>
        <P my="12px" fontWeight="400" fontSize="16px">
          <FormattedMessage
            defaultMessage="Adding a platform tip helps us to maintain the platform and introduce new features. <Link>Learn more</Link>"
            id="platformTip.oldLearnMore"
            values={{
              Link: chunk => {
                return (
                  <StyledLinkButton className="italic" onClick={() => setIsWhyPlatformTipModalOpen(true)}>
                    {chunk}
                  </StyledLinkButton>
                );
              },
            }}
          />
        </P>
        <div className="flex gap-5">
          <div>
            <FormattedMessage
              defaultMessage="Your tip: <bold>{amount}</bold> ({percentage}%)"
              id="fWPqud"
              values={{
                bold: I18nBold,
                amount: formatCurrency(props.value, props.currency as Currency, { locale: intl.locale }),
                percentage: (percentage * 100).toFixed(2),
              }}
            />
          </div>
          {isCollapsed && props.selectedOption !== PlatformTipOption.NONE && (
            <StyledLinkButton onClick={() => setIsCollapsed(false)}>
              <FormattedMessage id="Edit" defaultMessage="Edit" />
            </StyledLinkButton>
          )}
        </div>
        <div className={clsx('mt-3', { hidden: isCollapsed || props.selectedOption === PlatformTipOption.NONE })}>
          <PlatformTipInput
            disabled={!props.amount}
            amount={props.amount}
            currency={props.currency}
            selectedOption={props.selectedOption}
            value={props.value}
            onChange={props.onChange}
          />
        </div>
        {(!isCollapsed || props.selectedOption === PlatformTipOption.NONE) && (
          <React.Fragment>
            <P mt="12px" fontWeight="400" fontSize="16px">
              {message}
            </P>
            <div className="mt-3">
              <StyledCheckbox
                name="accept-payment-method-warning"
                checked={percentage === 0}
                onChange={({ checked }) =>
                  checked
                    ? props.onChange(PlatformTipOption.NONE, 0)
                    : props.onChange(
                        PlatformTipOption.FIFTEEN_PERCENT,
                        roundCentsAmount(0.15 * props.amount, props.currency),
                      )
                }
                label={
                  <span className="text-sm">
                    <FormattedMessage defaultMessage="I don't want to contribute to Open Collective" id="2fKAKF" />
                  </span>
                }
              />
            </div>
          </React.Fragment>
        )}
      </Box>
      {isWhyPlatformTipModalOpen && <WhyPlatformTipModal onClose={() => setIsWhyPlatformTipModalOpen(false)} />}
    </React.Fragment>
  );
}
