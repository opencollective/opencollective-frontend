import React from 'react';

const useKeyboardKey = ({ callback, keyMatch }) => {
  React.useEffect(() => {
    const onKeyDown = event => {
      let isRecognizedKey = false;
      if ('key' in event) {
        isRecognizedKey = event.key === keyMatch.key || event.key === keyMatch.keyName;
      } else {
        isRecognizedKey = event.keyCode === keyMatch.keyCode;
      }

      if (isRecognizedKey) {
        callback(event);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [callback, keyMatch]);
};

export default useKeyboardKey;

export const ESCAPE_KEY = {
  key: 'Escape',
  keyName: 'Esc',
  keyCode: 27,
};

export const ENTER_KEY = {
  key: 'Enter',
  keyName: 'Enter',
  keyCode: 13,
};

export const ARROW_LEFT_KEY = {
  key: 'ArrowLeft',
  keyName: 'Left arrow',
  keyCode: 37,
};

export const ARROW_RIGHT_KEY = {
  key: 'ArrowRight',
  keyName: 'Right arrow',
  keyCode: 39,
};

export const PAGE_UP_KEY = {
  key: 'PageUp',
  keyName: 'Page Up',
};

export const PAGE_DOWN_KEY = {
  key: 'PageDown',
  keyName: 'Page Down',
};

export const J = {
  key: 'j',
  keyName: 'J',
};

export const K = {
  key: 'k',
  keyName: 'K',
};

export const P = {
  key: 'p',
  keyName: 'P',
};

export const S = {
  key: 's',
  keyName: 'S',
};

export const E = {
  key: 'e',
  keyName: 'E',
};

export const H = {
  key: 'h',
  keyName: 'H',
};

export const I = {
  key: 'i',
  keyName: 'I',
};
