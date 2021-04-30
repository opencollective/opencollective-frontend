import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
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
  };

  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  renderButton() {
    const { buttonRenderer, withoutIcon, buttonProps, minWidth } = this.props;

    if (buttonRenderer) {
      return buttonRenderer({
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
    const { hostSlug } = this.props;

    return (
      <Fragment>
        {this.renderButton()}

        {this.state.showModal && (
          <ApplyToHostModal hostSlug={hostSlug} onClose={() => this.setState({ showModal: false })} />
        )}
      </Fragment>
    );
  }
}

export default ApplyToHostBtn;
