import React from 'react'
import PropTypes from 'prop-types'
import router from '../server/pages';

class Link extends React.Component {

  static propTypes = {
    route: PropTypes.string,
    params: PropTypes.object,
    target: PropTypes.string,
    title: PropTypes.string
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.isIframe = window.self !== window.top;
  }

  render() {
    const { route, params, children, ...otherProps } = this.props;
    if (this.isIframe) {
      const path = router.findByName(route).getAs(params);
      return (<a href={path} {...otherProps}>{children}</a>);
    } else {
      return (<router.Link {...this.props}>{children}</router.Link>);
    }
  }
}

export default Link;