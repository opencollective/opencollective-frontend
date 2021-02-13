import React from 'react';
import PropTypes from 'prop-types';
import { pick } from 'lodash';
import NextLink from 'next/link';
import Scrollchor from 'react-scrollchor';

class Link extends React.Component {
  static propTypes = {
    href: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    target: PropTypes.string,
    animate: PropTypes.object,
    className: PropTypes.string,
    title: PropTypes.string,
    onClick: PropTypes.func,
    openInNewTab: PropTypes.bool,
    children: PropTypes.node.isRequired,
    'data-cy': PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.isHash = props.href && this.constructRoutePath(props.href).substr(0, 1) === '#';
  }

  constructRoutePath(href) {
    if (typeof href === 'string') {
      return href;
    } else {
      return href.pathname;
    }
  }

  render() {
    const { href, children, className, title, onClick, openInNewTab } = this.props;
    const route = this.constructRoutePath(href);
    if (this.isHash) {
      const afterAnimate = () => {
        if (window.history) {
          history.pushState({ ...history.state, as: location.pathname + route }, undefined, route);
        }
      };
      return (
        <Scrollchor
          animate={this.props.animate}
          to={route.substr(1)}
          className={className}
          disableHistory={true}
          afterAnimate={afterAnimate}
        >
          {children}
        </Scrollchor>
      );
    } else {
      return (
        <NextLink {...pick(this.props, ['href', 'scroll', 'passHref'])}>
          <a
            className={className}
            title={title}
            onClick={onClick}
            data-cy={this.props['data-cy']}
            {...(!openInNewTab ? null : { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {children}
          </a>
        </NextLink>
      );
    }
  }
}

export default Link;
