import React from 'react'
import PropTypes from 'prop-types'
import router from '../server/pages';
import { pick } from 'lodash';
import HashLink from 'react-scrollchor';

class Link extends React.Component {

  static propTypes = {
    route: PropTypes.string,
    params: PropTypes.object,
    target: PropTypes.string,
    animate: PropTypes.object,
    className: PropTypes.string,
    title: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.isHash = props.route && props.route.substr(0, 1) === '#';
  }

  componentDidMount() {
    this.isIframe = window.self !== window.top && window.location.hostname !== "localhost"; // cypress is using an iframe for e2e testing
  }

  render() {
    const { route, params, children, className, title, ...otherProps } = this.props;
    if (this.isHash) {
      return (<HashLink animate={this.props.animate} to={route.substr(1)} className={className}>{children}</HashLink>);
    } else if (this.isIframe) {
      const routeFromRouter = router.findByName(route);
      if (!routeFromRouter) {
        console.error(">>> cannot find route ", route);
        return (<div>Cannot find route {route}</div>);
      }
      const path = routeFromRouter.getAs(params);
      return (<a href={path} title={title} className={className} {...otherProps}>{children}</a>);
    } else {
      return (<router.Link {...pick(this.props, ['route', 'params', 'href'])}><a className={className}>{children}</a></router.Link>);
    }
  }
}

export default Link;