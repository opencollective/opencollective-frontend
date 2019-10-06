import React from 'react';
import Scrollchor from 'react-scrollchor';
import PropTypes from 'prop-types';

class AnchorLink extends React.Component {
  static propTypes = {
    to: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    animate: PropTypes.object,
  };

  render() {
    const { to, children, className, animate, ...otherProps } = this.props;
    const afterAnimate = () => {
      if (window.history) {
        history.pushState({ ...history.state, as: location.pathname + to }, undefined, to);
      }
    };
    return (
      <Scrollchor
        animate={animate}
        to={to.substr(1)}
        className={className}
        disableHistory={true}
        afterAnimate={afterAnimate}
        {...otherProps}
      >
        {children}
      </Scrollchor>
    );
  }
}

export default AnchorLink;
