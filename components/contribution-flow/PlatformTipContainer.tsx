import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { Currency } from '../../lib/graphql/types/v2/graphql';
import theme from '../../lib/theme';

import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import Image from '../Image';
import StyledButtonSet from '../StyledButtonSet';
import StyledHr from '../StyledHr';
import StyledInputAmount from '../StyledInputAmount';
import StyledLinkButton from '../StyledLinkButton';
import { P } from '../Text';

import { WhyPlatformTipModal } from './WhyPlatformTipModal';

const I18nMessages = defineMessages({
  NO_THANKS: {
    id: 'NoThankYou',
    defaultMessage: 'No thank you',
  },
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
  const intl = useIntl();

  const options = React.useMemo(
    () => ({
      [PlatformTipOption.NONE]: {
        label: intl.formatMessage(I18nMessages.NO_THANKS),
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
      [PlatformTipOption.OTHER]: {
        label: intl.formatMessage(I18nMessages.OTHER),
        percent: 0.15,
      },
    }),
    [intl],
  );

  const onOptionChange = React.useCallback(
    (value: PlatformTipOption) => {
      if (props.selectedOption === value) {
        return;
      }

      props.onChange(value, options[value].percent * props.amount);
    },
    [props.onChange, props.selectedOption, props.amount, options],
  );

  const onOtherChange = React.useCallback(
    value => {
      props.onChange(props.selectedOption, value);
    },
    [props.onChange],
  );

  React.useEffect(() => {
    const newTipAmount =
      props.selectedOption === PlatformTipOption.OTHER
        ? props.value
        : options[props.selectedOption].percent * props.amount;

    props.onChange(props.selectedOption, newTipAmount);
  }, [options, props.amount, props.value, props.selectedOption]);

  return (
    <Box data-cy="platform-tip-input">
      <StyledButtonSet
        data-cy="platform-tip-options"
        flexDirection={['column', 'row']}
        disabled={props.disabled}
        items={[
          PlatformTipOption.NONE,
          PlatformTipOption.TEN_PERCENT,
          PlatformTipOption.FIFTEEN_PERCENT,
          PlatformTipOption.TWENTY_PERCENT,
          PlatformTipOption.OTHER,
        ]}
        selected={props.selectedOption}
        onChange={onOptionChange}
      >
        {({ item }) => options[item as number].label}
      </StyledButtonSet>
      {props.selectedOption === PlatformTipOption.OTHER && (
        <Flex mt={3} justifyContent="flex-end">
          <StyledInputAmount
            id="feesOnTop"
            name="platformTip"
            data-cy="platform-tip-other-amount"
            disabled={props.disabled}
            currency={props.currency}
            onChange={onOtherChange}
            value={props.value}
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (props.step === 'details') {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(true);
    }
  }, [props.step]);

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
            <FormattedMessage defaultMessage="Keep Open Collective Sustainable" />
            {isCollapsed && <StyledHr my={2} />}
            {isCollapsed && (
              <Flex fontSize="14px" gap="20px">
                <Box data-cy="platform-tip-collapsed">
                  <FormattedMessage
                    defaultMessage="Your tip: <bold>{amount}</bold> ({percentage}%)"
                    values={{
                      bold: I18nBold,
                      amount: formatCurrency(props.value, props.currency as Currency, { locale: intl.locale }),
                      percentage: ((props.value / props.amount) * 100).toFixed(2),
                    }}
                  />
                </Box>
                <StyledLinkButton onClick={() => setIsCollapsed(false)}>
                  <FormattedMessage id="Edit" defaultMessage="Edit" />
                </StyledLinkButton>
              </Flex>
            )}
          </Box>
        </Flex>
        {!isCollapsed && (
          <React.Fragment>
            <P mt="12px" fontWeight="400" fontSize="16px">
              <FormattedMessage defaultMessage="Adding a platform tip helps us to maintain the platform and introduce new features." />
            </P>
            <Flex mt="12px">
              <Box flexGrow={1} fontWeight="700" fontSize="16px">
                <FormattedMessage defaultMessage="Do you want to add a tip?" />
              </Box>
              <P fontStyle="italic">
                <StyledLinkButton onClick={() => setIsWhyPlatformTipModalOpen(true)}>
                  <FormattedMessage defaultMessage="Why?" />
                </StyledLinkButton>
              </P>
            </Flex>
            <Box mt="12px">
              <PlatformTipInput
                disabled={!props.amount}
                amount={props.amount}
                currency={props.currency}
                selectedOption={props.selectedOption}
                value={props.value}
                onChange={props.onChange}
              />
            </Box>
            <P mt="12px" fontWeight="400" fontSize="16px">
              <FormattedMessage defaultMessage="Thanks for your help." />
            </P>
          </React.Fragment>
        )}
      </Box>
      {isWhyPlatformTipModalOpen && <WhyPlatformTipModal onClose={() => setIsWhyPlatformTipModalOpen(false)} />}
    </React.Fragment>
  );
}
