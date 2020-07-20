import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import INTERVALS from '../../lib/constants/intervals';
import { getCurrencySymbol } from '../../lib/currency-utils';
import { i18nInterval } from '../../lib/i18n/interval';

import Currency from '../../components/Currency';
import { Box } from '../../components/Grid';
import StyledButtonSet from '../../components/StyledButtonSet';
import StyledInputField from '../../components/StyledInputField';

class NewContributionFlowStepDetails extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
    onChange: PropTypes.func,
    data: PropTypes.shape({
      amount: PropTypes.number,
      interval: PropTypes.string,
    }),
    collective: PropTypes.shape({
      currency: PropTypes.string,
    }),
    tier: PropTypes.shape({
      amountType: PropTypes.string,
    }),
  };

  getTierPresets = tier => {
    if (tier?.presets) {
      return tier.presets;
    } else {
      return [5000, 10000, 15000, 50000];
    }
  };

  onChange = (field, value) => {
    this.props.onChange({
      stepDetails: { ...this.props.data, [field]: value },
    });
  };

  render() {
    const { collective, tier, data, intl } = this.props;

    return (
      <Box width={1}>
        <StyledInputField
          label={
            <FormattedMessage
              id="contribution.amount.currency.label"
              defaultMessage="Amount ({currency})"
              values={{ currency: `${getCurrencySymbol(collective.currency)}${collective.currency}` }}
            />
          }
          htmlFor="amount"
          css={{ flexGrow: 1 }}
          labelFontSize={20}
          py={2}
          mb={24}
        >
          {fieldProps => (
            <StyledButtonSet
              {...fieldProps}
              justifyContent="center"
              mt={[4, 0]}
              items={this.getTierPresets(tier)}
              buttonProps={{ p: 2 }}
              selected={data?.amount}
              onChange={amount => this.onChange('amount', amount)}
            >
              {({ item }) => <Currency value={item} currency={collective.currency} precision={2} />}
            </StyledButtonSet>
          )}
        </StyledInputField>
        {(!tier || tier.amountType === 'FLEXIBLE') && (
          <StyledInputField
            label={<FormattedMessage id="contribution.interval.label" defaultMessage="Frequency" />}
            htmlFor="interval"
            css={{ flexGrow: 1 }}
            labelFontSize={20}
            py={2}
          >
            {fieldProps => (
              <StyledButtonSet
                {...fieldProps}
                justifyContent="center"
                mt={[4, 0]}
                items={[null, INTERVALS.month, INTERVALS.year]}
                selected={data?.interval}
                buttonProps={{ p: 2 }}
                onChange={interval => this.onChange('interval', interval)}
              >
                {({ item }) => i18nInterval(intl, item || INTERVALS.oneTime)}
              </StyledButtonSet>
            )}
          </StyledInputField>
        )}
      </Box>
    );
  }
}

export default injectIntl(NewContributionFlowStepDetails);
