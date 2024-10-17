import { useEffect, useState } from 'react';
import { throttle } from 'lodash';

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}

export const useWindowScroll = () => {
  const [yPosition, setYPosition] = useState(0);
  const [direction, setDirection] = useState(ScrollDirection.DOWN);
  const [accPosition, setAccPosition] = useState(0);

  useEffect(() => {
    let _yPosition = 0;
    let _direction: ScrollDirection = ScrollDirection.DOWN;
    let _accPosition = 0;

    const callback = throttle(() => {
      const newYPosition = window?.scrollY;
      const newDirection =
        newYPosition === _yPosition
          ? _direction
          : newYPosition > _yPosition
            ? ScrollDirection.DOWN
            : ScrollDirection.UP;
      const scrollDifference = Math.abs(newYPosition - _yPosition);

      _accPosition = newDirection !== _direction ? scrollDifference : _accPosition + scrollDifference;
      _yPosition = newYPosition;
      _direction = newDirection;

      setAccPosition(_accPosition);
      setDirection(newDirection);
      setYPosition(newYPosition);
    }, 17);

    callback();
    window.addEventListener('scroll', callback);
    return () => window.removeEventListener('scroll', callback);
  }, []);

  return { direction, yPosition, accPosition };
};
