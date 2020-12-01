import React from 'react';

const useKeyboardKey = ({ callback, keyName, keyAbb, keyCode }) => {
  React.useEffect(() => {
    const eventListener = event => {
      console.log(event);
      let isRecognizedKey = false;
      if ('key' in event) {
        isRecognizedKey = event.key === keyName || event.key === keyAbb;
      } else {
        isRecognizedKey = event.keyCode === keyCode;
      }

      if (isRecognizedKey) {
        callback();
      }
    };

    document.addEventListener('keydown', eventListener);
    return () => {
      document.removeEventListener('keydown', eventListener);
    };
  }, []);
};

export default useKeyboardKey;
