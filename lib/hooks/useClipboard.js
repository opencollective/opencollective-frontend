import React from 'react';
import copy from 'copy-to-clipboard';

/**
 * A custom react hook to copy values to the clipboard
 *
 * @param timeout: time before the isCopied flag is reset
 */
const useClipboard = ({ timeout = 3000 } = {}) => {
  const [isCopied, setCopied] = React.useState();
  const [updateCopyBtnTimeout, setUpdateCopyBtnTimeout] = React.useState();
  return {
    isCopied,
    copy: value => {
      copy(value);
      setCopied(true);

      if (updateCopyBtnTimeout) {
        clearTimeout(updateCopyBtnTimeout);
      }

      const timeoutFn = setTimeout(() => {
        setCopied(false);
      }, timeout);

      setUpdateCopyBtnTimeout(timeoutFn);
    },
  };
};

export default useClipboard;
