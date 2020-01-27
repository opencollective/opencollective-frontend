import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import { themeGet } from '@styled-system/theme-get';

import { imagePreview } from '../lib/utils';
import { upload } from '../lib/api';

const messages = defineMessages({
  placeholder: {
    id: 'uploadImage.placeholder',
    defaultMessage: 'Drop an image or click to upload',
  },
  isDragActive: {
    id: 'uploadImage.isDragActive',
    defaultMessage: "Drop it like it's hot 🔥",
  },
  isDragReject: {
    id: 'uploadImage.isDragReject',
    defaultMessage: '🚫 This file type is not accepted',
  },
  error: { id: 'errorMsg', defaultMessage: 'Error: {error}' },
});

const InputTypeDropzone = props => {
  const { defaultValue, className, onChange, options, intl, placeholder, name } = props;
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState(null);

  const handleChange = files => {
    if (!files) {
      setValue(null);
      setUrl(null);
      setLoading(false);
      return onChange(null);
    }

    setLoading(true);
    // for e2e testing purposes
    if (window.location.hostname === 'localhost') {
      const fileUrl = 'https://d.pr/free/i/OlQVIb+';
      return setTimeout(() => {
        setValue(fileUrl);
        setUrl(fileUrl);
        setLoading(false);
        return onChange(fileUrl);
      }, 2500);
    }

    const file = files[0];
    upload(file)
      .then(fileUrl => {
        setValue(fileUrl);
        setUrl(fileUrl);
        setLoading(false);
        setError(null);
        return onChange(fileUrl);
      })
      .catch(err => {
        const message = get(err, ['json', 'error', 'fields', 'file']);
        setError(message || 'error uploading image, please try again');
        setLoading(false);
      });
  };

  const renderContainer = (isDragActive, isDragReject) => {
    let messageId = 'placeholder';
    if (isDragActive) {
      messageId = 'isDragActive';
    }
    if (isDragReject) {
      messageId = 'isDragReject';
    }
    if (error) {
      messageId = 'error';
    }

    return (
      <div>
        <style jsx>
          {`
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
              background: rgba(255, 255, 255, 0.4);
            }
            .loading {
              background: rgba(255, 255, 255, 0.5);
            }
            .placeholder {
              display: none;
            }
            .loading img {
              animation: oc-rotate 0.8s infinite linear;
            }
            @keyframes oc-rotate {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
            img {
              width: 100%;
            }
          `}
        </style>
        {messageId && (
          <div className={`message ${messageId}`}>
            {intl.formatMessage(messages[messageId], {
              error: error,
            })}
          </div>
        )}
        {loading && (
          <div className="message loading">
            <img
              src="/static/images/opencollective-icon.svg"
              width="40"
              height="40"
              className="logo"
              alt="Open Collective logo"
            />
          </div>
        )}
        <img
          src={imagePreview(url, placeholder, {
            width: 128,
          })}
        />
      </div>
    );
  };

  const option = options || {};
  option.accept = option.accept || 'image/png, image/jpeg';

  const onDrop = useCallback(files => {
    files.length && handleChange(files);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: option.accept,
    multiple: false,
    onDrop,
  });

  return (
    <div className={`InputTypeDropzone ${className}`}>
      <style jsx global>
        {`
          .dropzone {
            border: 2px dashed transparent;
            position: relative;
            min-height: 80px;
            overflow: hidden;
          }
          .dropzone:hover .placeholder {
            display: flex;
          }
          .dropzone:hover,
          .dropzone.empty {
            border-color: grey;
          }
          .dropzone:hover .placeholder,
          .dropzone.empty .placeholder {
            display: flex;
          }
          .dropzone:focus {
            border-color: ${themeGet('colors.primary.300')};
          }
          .removeImage {
            color: ${themeGet('colors.primary.400')};
            cursor: pointer;
            font-size: 11px;
          }
          .removeImage:hover {
            color: ${themeGet('colors.primary.500')};
          }
        `}
      </style>
      <div {...getRootProps()} className={`${name}-dropzone dropzone ${!value && 'empty'}`}>
        <input {...getInputProps()} />
        {renderContainer(isDragActive, isDragReject)}
      </div>
      {value && (
        <span
          className="removeImage"
          tabIndex="0"
          onClick={() => handleChange(null)}
          onKeyDown={({ key }) => key === 'Enter' && handleChange(null)}
        >
          ❌ remove image
        </span>
      )}
    </div>
  );
};

InputTypeDropzone.propTypes = {
  defaultValue: PropTypes.string,
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.object,
  intl: PropTypes.object.isRequired,
  placeholder: PropTypes.string,
  name: PropTypes.string,
};

export default injectIntl(InputTypeDropzone);
