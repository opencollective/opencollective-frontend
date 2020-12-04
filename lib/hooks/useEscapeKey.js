import React from 'react';

const useEscapeKey = callback => {
  React.useEffect(() => {
    const eventListener = event => {
      let isEscape = false;
      if ('key' in event) {
        isEscape = event.key === 'Escape' || event.key === 'Esc';
      } else {
        isEscape = event.keyCode === 27;
      }

      if (isEscape) {
        callback();
      }
    };

    document.addEventListener('keydown', eventListener);
    return () => {
      document.removeEventListener('keydown', eventListener);
    };
  }, []);
};

export default useEscapeKey;
