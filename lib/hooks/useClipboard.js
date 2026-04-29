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
      try {
        const ok = await copy(value);
        if (ok) {
          setCopied(true);

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            setCopied(false);
          }, timeout);
        }
      } catch {
        // Unhandled copy failures: leave isCopied false
      }
    },
    [timeout],
  );

  return {
    isCopied,
    copy: copyCallback,
  };
};

export default useClipboard;
