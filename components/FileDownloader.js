import React from 'react';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';

/**
 * A generic wrapper to handle the flow of downloading a file (fetching from URL,
 * saving...etc).
 */
export default class FileDownloader extends React.Component {
  static propTypes = {
    filename: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    buildFetchParams: PropTypes.func,
    children: PropTypes.func,
  };

  static defaultProps = {
    buildFetchParams: () => {},
  };

  state = {
    loading: false,
    error: false,
    downloaded: false,
  };

  downloadFile = async () => {
    try {
      this.setState({ loading: true });
      const response = await fetch(this.props.url, this.props.buildFetchParams());
      const file = await response.blob();
      saveAs(file, this.props.filename);
      this.setState({ loading: false, downloaded: true });
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  };

  render() {
    const { loading, error, downloaded } = this.state;
    return this.props.children({
      loading,
      error,
      downloaded,
      downloadFile: this.downloadFile,
    });
  }
}
