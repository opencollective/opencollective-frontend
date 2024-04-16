import React from 'react';

export const HintText = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-xs text-gray-600">{children}</p>;
};
