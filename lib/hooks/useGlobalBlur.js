import React from 'react';

export default (ref, callback) => {
  const wasOutside = e => callback(!ref.current?.contains(e.target));

  React.useEffect(() => {
    document.addEventListener('mousedown', wasOutside, false);
    return () => document.removeEventListener('mousedown', wasOutside, false);
  });
};
