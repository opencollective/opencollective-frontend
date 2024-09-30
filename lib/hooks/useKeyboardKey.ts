import React from 'react';

const INPUT_ELEMENTS = ['INPUT', 'TEXTAREA', 'TRIX-EDITOR'];

type KeyMatch = {
  key: string;
  keyName: string;
  keyCode?: number;
};

type UseKeyboardKeyProps = {
  callback: (event: KeyboardEvent) => void;
  keyMatch: KeyMatch;
  disableOnInput?: boolean;
};

const useKeyboardKey = ({ callback, keyMatch, disableOnInput }: UseKeyboardKeyProps) => {
  React.useEffect(() => {
    const onKeyDown = event => {
      if (disableOnInput !== false && INPUT_ELEMENTS.includes(event.target.tagName)) {
        return;
      }

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

export const useKeyboardSequence = ({
  sequence,
  callback,
  disableOnInput,
}: Omit<UseKeyboardKeyProps, 'keyMatch'> & { sequence: KeyMatch[] }) => {
  const [sequenceIndex, setSequenceIndex] = React.useState(0);
  React.useEffect(() => {
    const onKeyDown = event => {
      if (disableOnInput !== false && INPUT_ELEMENTS.includes(event.target.tagName)) {
        return;
      }

      let isRecognizedKey = false;
      const expectedKey = sequence[sequenceIndex];
      if ('key' in event && expectedKey?.key) {
        isRecognizedKey = event.key === expectedKey.key || event.key === expectedKey.keyName;
      }

      if (isRecognizedKey) {
        setSequenceIndex(sequenceIndex + 1);
        if (sequenceIndex === sequence.length - 1) {
          callback(event);
        }
      } else {
        setSequenceIndex(0);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [callback, sequence]);
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

export const ARROW_UP_KEY = {
  key: 'ArrowUp',
  keyName: 'Up arrow',
};

export const ARROW_DOWN_KEY = {
  key: 'ArrowDown',
  keyName: 'Down arrow',
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

export const A = {
  key: 'a',
  keyName: 'A',
};

export const B = {
  key: 'b',
  keyName: 'B',
};
