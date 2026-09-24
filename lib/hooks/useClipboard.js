import React from 'react';
import copy from 'copy-to-clipboard';

/**
 * A custom react hook to copy values to the clipboard
 *
 * @param timeout: time before the isCopied flag is reset
 */
const useClipboard = ({ timeout = 3000 } = {}) => {
  const [isCopied, setCopied] = React.useState();
  const timeoutRef = React.useRef(undefined);

  const copyCallback = React.useCallback(
    async value => {
      const success = await copy(value);
      if (!success) {
        return false;
      }

      setCopied(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, timeout);

      return true;
    },
    [timeout],
  );

  return {
    isCopied,
    copy: copyCallback,
  };
};

export default useClipboard;
