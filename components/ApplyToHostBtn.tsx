import React, { Fragment } from 'react';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import type { Router } from 'next/router';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import ApplyToHostModal from './ApplyToHostModal';
import type { StyledButtonProps } from './StyledButton';
import StyledButton from './StyledButton';

type Props = {
  hostSlug: string;
  minWidth?: number | string;
  withoutIcon?: boolean;
  buttonProps?: Partial<StyledButtonProps>;
  buttonRenderer?: (props: React.ComponentProps<typeof StyledButton>) => React.ReactNode;
  router: Router;
  isHidden?: boolean;
};

type State = {
  showModal: boolean;
};

class ApplyToHostBtn extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { showModal: false };
  }

  componentDidMount() {
    const { router } = this.props;

    if (router.query.action === 'apply') {
      this.setState({ showModal: true });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { router } = this.props;

    if (router.query.action !== 'apply' && prevProps.router.query.action === 'apply') {
      this.setState({ showModal: false });
    }

    if (router.query.action === 'apply' && prevProps.router.query.action !== 'apply') {
      this.setState({ showModal: true });
    }
  }

  renderButton() {
    const { buttonRenderer, withoutIcon, buttonProps, minWidth, hostSlug, router } = this.props;

    if (buttonRenderer) {
      return buttonRenderer({
        onClick: () => router.push(`${hostSlug}/apply`),
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
        onClick={() => router.push(`${hostSlug}/apply`)}
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
    const { hostSlug, router, isHidden } = this.props;

    return (
      <Fragment>
        {this.renderButton()}

        {this.state.showModal && !isHidden && (
          <ApplyToHostModal hostSlug={hostSlug} onClose={() => router.push(hostSlug)} />
        )}
      </Fragment>
    );
  }
}

export default withRouter(ApplyToHostBtn);
