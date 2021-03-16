import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import FlipMove from 'react-flip-move';

import Container from './Container';
import { Box } from './Grid';
import Toast from './Toast';
import { TOAST_TYPE, withToasts } from './ToastProvider';

const UPDATE_INTERVAL = 500; // milliseconds
const DEFAULT_TOAST_DURATION = 15000; // milliseconds

class GlobalToasts extends PureComponent {
  static propTypes = {
    removeToasts: PropTypes.func.isRequired,
    toasts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.oneOf(Object.values(TOAST_TYPE)).isRequired,
        title: PropTypes.string.isRequired,
        message: PropTypes.string,
        createdAt: PropTypes.number,
      }),
    ),
  };

  constructor(props) {
    super(props);
    this.updateInterval = null;
    this.startTimeout = null;
    this.state = { isPaused: false };
  }

  componentDidMount() {
    if (this.props.toasts?.length) {
      this.setUpdateInterval();
    }
  }

  componentDidUpdate(oldProps) {
    if (!this.props.toasts?.length) {
      this.clearUpdateInterval();
    } else {
      if (this.state.isPaused && !oldProps.toasts?.length) {
        this.setState({ isPaused: false });
      }

      this.setUpdateInterval();
    }
  }

  setUpdateInterval() {
    if (this.updateInterval === null) {
      this.updateInterval = setInterval(this.updateToasts, UPDATE_INTERVAL);
    }
  }

  clearUpdateInterval() {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateToasts = () => {
    if (this.state.isPaused || !this.props.toasts?.length) {
      return;
    } else {
      this.forceUpdate(); // Force update to animate properly (though timeLeft)
      this.props.removeToasts(toast => this.getTimeLeft(toast) <= 0);
    }
  };

  getTimeLeft = toast => {
    const expiresAt = toast.createdAt + (toast.duration || DEFAULT_TOAST_DURATION);
    return expiresAt - Date.now();
  };

  pause = () => {
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }

    this.setState({ isPaused: true });
  };

  /** Start after a delay to make sure toasts don't disappear right after mouse leaves */
  startAfterDelay = () => {
    if (this.state.isPaused && !this.startTimeout) {
      this.startTimeout = setTimeout(() => {
        this.startTimeout = null;
        this.setState({ isPaused: false });
      }, 2000);
    }
  };

  render() {
    if (!this.props.toasts?.length) {
      return null;
    }

    return (
      <Container
        position="fixed"
        bottom={[15, 40]}
        right={[15, 40]}
        maxWidth={306}
        width="100%"
        onMouseEnter={this.pause}
        onMouseLeave={this.startAfterDelay}
        zIndex={100000}
      >
        <FlipMove>
          {this.props.toasts.map(toast => (
            <Box key={toast.id} mt={24}>
              <Toast
                toast={toast}
                timeLeft={this.getTimeLeft(toast)}
                onClose={() => this.props.removeToasts(t => t.id === toast.id)}
              />
            </Box>
          ))}
        </FlipMove>
      </Container>
    );
  }
}

export default withToasts(GlobalToasts);
