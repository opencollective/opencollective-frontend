import React from 'react';

import { H4 } from '../Text';

export default function Agreement({ agreement }) {
  return (
    <div>
      <H4>{agreement.title}</H4>
    </div>
  );
}
