import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import ApplyToHostModal from './ApplyToHostModal';
import StyledButton from './StyledButton';
import StyledTooltip from './StyledTooltip';

class ApplyToHostBtn extends React.Component {
  static propTypes = {
    hostSlug: PropTypes.string.isRequired,
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    withoutIcon: PropTypes.bool,
    buttonProps: PropTypes.object,
    buttonRenderer: PropTypes.func,
    router: PropTypes.object,
    isHidden: PropTypes.bool,
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  componentDidMount() {
    const { router } = this.props;

    if (router.query.action === 'apply') {
      this.setState({ showModal: true });
    }
  }

  componentDidUpdate(prevProps) {
    const { router } = this.props;

    if (router.query.action !== 'apply' && prevProps.router.query.action === 'apply') {
      this.setState({ showModal: false });
    }

    if (router.query.action === 'apply' && prevProps.router.query.action !== 'apply') {
      this.setState({ showModal: true });
    }
  }

  renderButton() {
    const { buttonRenderer, withoutIcon, buttonProps, minWidth, hostSlug, router, disabled } = this.props;
    const onClick = disabled ? undefined : () => router.push(`${hostSlug}/apply`);

    if (buttonRenderer) {
      return buttonRenderer({
        onClick,
        disabled,
        'data-cy': 'host-apply-btn',
        ...buttonProps,
        children: (
          <React.Fragment>
            {!withoutIcon && <CheckCircle size="1em" />}
            {!withoutIcon && ' '}
            <span>
              <FormattedMessage id="ApplyToHost" defaultMessage="Apply" />
            </span>
          </React.Fragment>
        ),
      });
    }

    return (
      <StyledButton
        buttonStyle="secondary"
        buttonSize="small"
        onClick={onClick}
        disabled={disabled}
        minWidth={minWidth}
        data-cy="host-apply-btn"
        {...buttonProps}
      >
        {!withoutIcon && <CheckCircle size="20px" color="#304CDC" />}
        <FormattedMessage id="ApplyToHost" defaultMessage="Apply" />
      </StyledButton>
    );
  }

  render() {
    const { hostSlug, router, isHidden, disabled } = this.props;

    return (
      <Fragment>
        {disabled ? (
          <StyledTooltip
            content={
              <FormattedMessage
                defaultMessage="This Fiscal Host is not open to applications"
                id="collectives.create.error.HostNotOpenToApplications"
              />
            }
          >
            {this.renderButton()}
          </StyledTooltip>
        ) : (
          this.renderButton()
        )}

        {this.state.showModal && !isHidden && !disabled && (
          <ApplyToHostModal hostSlug={hostSlug} onClose={() => router.push(hostSlug)} />
        )}
      </Fragment>
    );
  }
}

export default withRouter(ApplyToHostBtn);
