import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import { FormattedMessage } from 'react-intl';

import ApplyToHostModal from './ApplyToHostModal';
import { getI18nLink } from './I18nFormatters';
import Link from './Link';
import StyledButton from './StyledButton';
import StyledTooltip from './StyledTooltip';

class ApplyToHostBtn extends React.Component {
  static propTypes = {
    hostSlug: PropTypes.string.isRequired,
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hostWithinLimit: PropTypes.bool,
    withoutIcon: PropTypes.bool,
    buttonProps: PropTypes.object,
  };

  static defaultProps = {
    hostWithinLimit: true,
  };

  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  renderButton() {
    const { hostWithinLimit, withoutIcon, buttonProps, minWidth } = this.props;
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
                defaultMessage="Host already reached the limit of hosted collectives for its plan. <a>Contact {collectiveName}</a> and let them know you want to apply."
                values={{
                  collectiveName: hostSlug,
                  a: getI18nLink({ as: Link, route: 'collective-contact', params: { collectiveSlug: hostSlug } }),
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
