import React from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone'
import fetch from 'isomorphic-fetch';
import { imagePreview } from '../lib/utils';
import { upload } from '../lib/api';
import withIntl from '../lib/withIntl';
import { defineMessages, FormattedMessage } from 'react-intl';

class InputTypeDropzone extends React.Component {

  static propTypes = {
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.renderContainer = this.renderContainer.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = { loading: false, value: props.defaultValue, url: props.defaultValue }; // value can be base64 encoded after upload, url is always an url
    this.messages = defineMessages({
      placeholder: { id: 'uploadImage.placeholder', defaultMessage: "Drop an image or click to upload" },
      isDragActive: { id: 'uploadImage.isDragActive', defaultMessage: "Drop it like it's hot 🔥" },
      isDragReject: { id: 'uploadImage.isDragReject', defaultMessage: "🚫 This file type is not accepted" },
      error: { id: 'uploadImage.error', defaultMessage: "Error: {error}" }
    })
  }

  handleChange(files) {
    this.setState({ loading: true });
    // for e2e testing purposes
    if (window.location.hostname === 'localhost') {
      const fileUrl = "https://d.pr/free/i/OlQVIb+";
      return setTimeout(() => {
        this.setState({ value: fileUrl, url: fileUrl, loading: false });
        return this.props.onChange(fileUrl);
      }, 2500);
    }

    const file = files[0];
    upload(file)
      .then(fileUrl => {
        this.setState({ value: fileUrl, url: fileUrl, loading: false });
        return this.props.onChange(fileUrl);
      })
      .catch(err => {
        console.error(">>> error uploading image", file, err);
        this.setState({ error: "error uploading image, please try again", loading: false });
      });
  }

  renderContainer({ isDragActive, isDragReject, acceptedFiles, rejectedFiles }) {
    const { intl } = this.props;

    let messageId = "placeholder";
    if (isDragActive) {
      messageId = "isDragActive";
    }
    if (isDragReject) {
      messageId = "isDragReject";
    }
    if (this.state.error) {
      messageId = "error";
    }

    return (
      <div>
        <style jsx>{`
          .message {
            position: absolute;
            font-size: 1rem;
            padding: 1rem;
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.4);
          }
          .loading {
            background: rgba(255,255,255,0.5);
          }
          .placeholder {
            display: none;
          }
          .loading img {
            animation: oc-rotate 0.8s infinite linear;
          }
          @keyframes oc-rotate {
            0%    { transform: rotate(0deg); }
            100%  { transform: rotate(360deg); }
          }
        `}</style>
        { messageId &&
          <div className={`message ${messageId}`}>
            {intl.formatMessage(this.messages[messageId], { error: this.state.error })}
          </div>
        }
        { this.state.loading &&
          <div className="message loading">
            <img src="/static/images/opencollective-icon.svg" width="40" height="40" className="logo" alt="Open Collective logo" />
          </div>
        }
        <img src={imagePreview(this.state.url, this.props.placeholder, { width: 128 })} />
        </div>
    )
  }

  render() {
    const { intl } = this.props;
    const options = this.props.options || {};
    options.accept = options.accept || 'image/png, image/jpeg';

    return (
      <div className={`InputTypeDropzone ${this.props.className}`}>
        <style jsx global>{`
          .dropzone {
            border: 2px dashed transparent;
            position: relative;
            min-height: 80px;
          }
          .dropzone:hover .placeholder {
            display: flex;
          }
          .dropzone:hover, .dropzone.empty {
            border: 2px dashed grey;
          }
          .dropzone:hover .placeholder, .dropzone.empty .placeholder {
            display: flex;
          }
        `}</style>
        <Dropzone
          multiple={false}
          onDrop={this.handleChange}
          className={`${this.props.name}-dropzone dropzone ${!this.state.value && 'empty'}`}
          style={{}}
          {...options}
          >
          { this.renderContainer }
        </Dropzone>
      </div>
    );
  }
}

export default withIntl(InputTypeDropzone);
