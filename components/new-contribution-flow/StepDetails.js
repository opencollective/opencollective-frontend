import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { first } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../../components/Container';
import Currency from '../../components/Currency';
import FormattedMoneyAmount from '../../components/FormattedMoneyAmount';
import { Box, Flex } from '../../components/Grid';
import Link from '../../components/Link';
import StyledButtonSet from '../../components/StyledButtonSet';
import StyledInputField from '../../components/StyledInputField';
import { H4, P } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

class NewContributionFlowStepDetails extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      amount: null,
    };
  }

  getTier = tiers => {
    if (this.props.router.query.tier) {
      return tiers.nodes.find(option => option.name === this.props.router.query.tier);
    }
  };

  getTierType = tier => {
    return tier.amountType;
  };

  getTierPresets = tier => {
    if (tier.presets) {
      return tier.presets;
    } else {
      return [5000, 10000, 15000, 50000];
    }
  };

  render() {
    const { collective, LoggedInUser, router } = this.props;
    const { amount, frequency } = this.state;

    const tier = this.getTier(collective.tiers);
    const tierType = this.getTierType(tier);
    const tierPresets = this.getTierPresets(tier);

    return (
      <Box width={1}>
        <StyledInputField
          label={
            <FormattedMessage
              id="contribution.amount.currency.label"
              values={{
                currency: collective.currency,
              }}
              defaultMessage="Amount ({currency})"
            />
          }
          htmlFor="frequency"
          css={{ flexGrow: 1 }}
          labelFontSize={20}
          py={2}
        >
          {fieldProps => (
            <StyledButtonSet
              {...fieldProps}
              justifyContent="center"
              mt={[4, 0]}
              items={tierPresets}
              selected={amount}
              buttonProps={{ p: 2 }}
              onChange={amount => {
                this.setState({ amount });
              }}
            >
              {({ item }) => <Currency value={item} currency={collective.currency} precision={2} />}
            </StyledButtonSet>
          )}
        </StyledInputField>
        {tierType === 'FLEXIBLE' && (
          <StyledInputField
            label={<FormattedMessage id="contribution.interval.label" defaultMessage="Frequency" />}
            htmlFor="frequency"
            css={{ flexGrow: 1 }}
            labelFontSize={20}
            py={2}
          >
            {fieldProps => (
              <StyledButtonSet
                {...fieldProps}
                justifyContent="center"
                mt={[4, 0]}
                items={['One time', 'Monthly', 'Yearly']}
                selected={frequency}
                buttonProps={{ p: 2 }}
                onChange={frequency => {
                  this.setState({ frequency });
                }}
              >
                {({ item }) => <P>{item}</P>}
              </StyledButtonSet>
            )}
          </StyledInputField>
        )}
      </Box>
    );
  }
}

export default injectIntl(withUser(withRouter(NewContributionFlowStepDetails)));
