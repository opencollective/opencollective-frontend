import React from 'react';
import copy from 'copy-to-clipboard';

/**
 * A custom react hook to copy values to the clipboard
 *
 * @param timeout: time before the isCopied flag is reset
 */
const useClipboard = ({ timeout = 3000 } = {}) => {
  const [isCopied, setCopied] = React.useState();
  const timeoutRef = React.useRef();

  const copyCallback = React.useCallback(
    async value => {
      copy(value);
      setCopied(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, [timeout]);
    },
    [timeout],
  );

  return React.useMemo(
    () => ({
      isCopied,
      copy: copyCallback,
    }),
    [isCopied, copyCallback],
  );
};

export default useClipboard;
