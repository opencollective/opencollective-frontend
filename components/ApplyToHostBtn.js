import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import NextLink from 'next/link';
import { FormattedMessage } from 'react-intl';

import ApplyToHostModal from './ApplyToHostModal';
import { getI18nLink } from './I18nFormatters';
import StyledButton from './StyledButton';
import StyledTooltip from './StyledTooltip';

class ApplyToHostBtn extends React.Component {
  static propTypes = {
    hostSlug: PropTypes.string.isRequired,
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hostWithinLimit: PropTypes.bool,
    withoutIcon: PropTypes.bool,
    buttonProps: PropTypes.object,
    buttonRenderer: PropTypes.func,
  };

  static defaultProps = {
    hostWithinLimit: true,
  };

  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  renderButton() {
    const { buttonRenderer, hostWithinLimit, withoutIcon, buttonProps, minWidth } = this.props;

    if (buttonRenderer) {
      return buttonRenderer({
        disabled: !hostWithinLimit,
        onClick: () => this.setState({ showModal: true }),
        'data-cy': 'host-apply-btn',
        ...buttonProps,
        children: (
          <React.Fragment>
            {!withoutIcon && <CheckCircle size="1em" />}
            {!withoutIcon && ' '}
            <span>
              <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply" />
            </span>
          </React.Fragment>
        ),
      });
    }

    return (
      <StyledButton
        buttonStyle="secondary"
        buttonSize="small"
        disabled={!hostWithinLimit}
        onClick={() => this.setState({ showModal: true })}
        minWidth={minWidth}
        data-cy="host-apply-btn"
        {...buttonProps}
      >
        {!withoutIcon && <CheckCircle size="20px" color="#304CDC" />}
        <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply" />
      </StyledButton>
    );
  }

  render() {
    const { hostSlug, hostWithinLimit } = this.props;

    return (
      <Fragment>
        {hostWithinLimit ? (
          this.renderButton()
        ) : (
          <StyledTooltip
            place="left"
            content={
              <FormattedMessage
                id="host.hostLimit.warning"
                defaultMessage="This Fiscal Host has reached its Collective limit. <a>Contact {collectiveName}</a> to request they upgrade, and let them know you want to apply."
                values={{
                  collectiveName: hostSlug,
                  a: getI18nLink({ as: NextLink, href: `${hostSlug}/contact` }),
                }}
              />
            }
          >
            {this.renderButton()}
          </StyledTooltip>
        )}
        {this.state.showModal && (
          <ApplyToHostModal hostSlug={hostSlug} onClose={() => this.setState({ showModal: false })} />
        )}
      </Fragment>
    );
  }
}

export default ApplyToHostBtn;
