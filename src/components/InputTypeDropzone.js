import React from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone'
import fetch from 'isomorphic-fetch';

class InputTypeDropzone extends React.Component {

  static propTypes = {
    value: PropTypes.object,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { value: props.value };
  }

  /**
   * The Promise returned from fetch() won't reject on HTTP error status. We
   * need to throw an error ourselves.
   */
  checkStatus(response) {
    const { status } = response;

    if (status >= 200 && status < 300) {
      return response.json();
    } else {
      return response.json()
      .then((json) => {
        const error = new Error(json.error.message);
        error.json = json;
        error.response = response;
        throw error;
      });
    }
  }

  addAuthTokenToHeader(obj = {}) {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return obj;
    return {
      Authorization: `Bearer ${accessToken}`,
      ...obj,
    };
  }

  handleChange(files) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.setState({ value: e.target.result })
    }
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/images', {
      method: 'post',
      headers: this.addAuthTokenToHeader(),
      body: formData,
    })
    .then(this.checkStatus)
    .then(json => {
      console.log(">>> upload response", json);
      return this.props.onChange(json.url);
    })
    .catch(err => {
      console.error(">>> error uploading image", file, err);
      this.setState({ error: "error uploading image, please try again" });
    });
  }

  render() {

    const options = this.props.options || {};
    options.accept = options.accept || 'image/png, image/jpeg';

    return (
      <div className={`InputTypeDropzone ${this.props.className}`}>
        <style jsx global>{`
          .dropzone {
            border: 2px dashed transparent;
            position: relative;
            min-height: 100px;
          }
          .dropzone .placeholder {
            position:absolute;
            font-size: 1rem;
            text-align: center;
            display: none;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.4);
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
          placeholder={this.props.placeholder}
          className={`${this.props.name}-dropzone dropzone ${!this.state.value && 'empty'}`}
          style={{}}
          {...options}
        >
          {({ isDragActive, isDragReject, acceptedFiles, rejectedFiles }) => {
            if (isDragActive) {
              return "This file is authorized";
            }
            if (isDragReject) {
              return "This file is not authorized";
            }
            if (this.state.error) {
              return this.state.error;
            }
            return (
              <div>
                <div className="placeholder">Drop an image or click to upload</div>
                <img className="preview" src={this.state.value} />
              </div>
            );
          }}
        </Dropzone>
      </div>
    );
  }
}

export default InputTypeDropzone;