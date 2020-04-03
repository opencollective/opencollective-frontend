import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import MessageBox from '../MessageBox';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

class ExpenseNeedsTaxFormBadge extends React.Component {
  static propTypes = {
    isTaxFormRequired: PropTypes.bool,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      hover: {
        id: 'expenseNeedsTaxForm.hover',
        defaultMessage:
          "We can't pay until we receive your tax info. Check your inbox for an email from HelloWorks. Need help? Contact support@opencollective.com",
      },
      taxFormRequired: { id: 'expenseNeedsTaxForm.taxFormRequired', defaultMessage: 'tax form required' },
    });
  }

  render() {
    const { intl, isTaxFormRequired } = this.props;

    const message = intl.formatMessage(this.messages.taxFormRequired);
    const hoverMessage = intl.formatMessage(this.messages.hover);

    return (
      !!isTaxFormRequired && (
        <Span display="inline-block">
          {' | '}
          <span data-toggle="tooltip" data-placement="bottom" title={hoverMessage}>
            <MessageBox type="warning" display="inline" css={{ padding: '4px', borderRadius: '5px' }} withIcon={true}>
              <StyledLink
                css={{ textTransform: 'uppercase' }}
                href="https://docs.opencollective.com/help/expenses/tax-information"
              >
                {message}
              </StyledLink>
            </MessageBox>
          </span>
        </Span>
      )
    );
  }
}

export default injectIntl(ExpenseNeedsTaxFormBadge);
