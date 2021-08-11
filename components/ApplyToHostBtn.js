import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import ApplyToHostModal from './ApplyToHostModal';
import StyledButton from './StyledButton';

class ApplyToHostBtn extends React.Component {
  static propTypes = {
    hostSlug: PropTypes.string.isRequired,
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    withoutIcon: PropTypes.bool,
    buttonProps: PropTypes.object,
    buttonRenderer: PropTypes.func,
    router: PropTypes.object,
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

  showApplyToHostModal(router, slug) {
    router.push(`${slug}/apply`);
    return this.setState({ showModal: true });
  }

  renderButton() {
    const { buttonRenderer, withoutIcon, buttonProps, minWidth, hostSlug, router } = this.props;

    if (buttonRenderer) {
      return buttonRenderer({
        onClick: () => this.showApplyToHostModal(router, hostSlug),
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
        onClick={() => this.showApplyToHostModal(router, hostSlug)}
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
    const { hostSlug, router } = this.props;

    return (
      <Fragment>
        {this.renderButton()}

        {this.state.showModal && (
          <ApplyToHostModal
            hostSlug={hostSlug}
            onClose={() => {
              router.push(hostSlug);
              this.setState({ showModal: false });
            }}
          />
        )}
      </Fragment>
    );
  }
}

export default withRouter(ApplyToHostBtn);
